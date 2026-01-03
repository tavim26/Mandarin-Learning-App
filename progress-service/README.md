# Progress Service - Chinese Learning Platform

Microserviciu pentru tracking progres studenti: exercitii rezolvate, evaluare automata raspunsuri, calculare progres lectii si sincronizare student identity prin RabbitMQ events.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA + JSONB support)
* **RabbitMQ** (AMQP) pentru event consumption
* **RestTemplate** pentru inter-service communication
* **Maven** + **SpringDoc OpenAPI**
* **Docker** + Amazon Corretto 21

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + evaluation engine + event handling
controller/   -> REST endpoints + Swagger docs
config/       -> RabbitMQ consumer configuration
events/       -> Event DTOs (StudentCreatedEvent, etc.) + EventConsumer
clients/      -> REST clients (ContentServiceClient, UserServiceClient)
```

**Reguli Implementare (AI Context):**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod si comentarii (encoding safety)
- Comentarii DOAR cu // (INTERZIS /* ... */)
- Controllers NU importa DAO (separation of concerns strict)
- Service layer encapsuleaza toata logica de evaluare si validare
- Null-checks OBLIGATORII in toate metodele de evaluare

## Schema Baza de Date

**Database:** `progress_database` (postgres/kuso)  
**Port:** 8083  
**Swagger:** http://localhost:8083/swagger-ui/index.html

### Tabele si Relatii:

```
students_replica (PK: student_id, NOT auto-inc)
├── student_id (provenit din User Service via RabbitMQ)
├── full_name
├── email
└── synced_at (timestamp ultima sincronizare)

exercise_attempts (PK: id, auto-inc)
├── id
├── student_id (FK logical -> students_replica.student_id)
├── exercise_id (validated via Content Service API - NO FK!)
├── attempt_number (increment per student+exercise)
├── submitted_at (timestamp)
├── submitted_answer (JSONB) - flexible format per exercise type
├── is_correct (boolean, based on score >= 70)
├── score (NUMERIC 0-100)
└── feedback_text (evaluation feedback)

student_lesson_progress (PK: composite - student_id + lesson_id)
├── student_id (FK logical -> students_replica.student_id)
├── lesson_id (validated via Content Service API - NO FK!)
├── status (VARCHAR: NOT_STARTED, IN_PROGRESS, COMPLETED)
├── completion_pct (NUMERIC 0-100, calculated from exercises)
├── xp_awarded (INTEGER, NULL until COMPLETED, prevent duplicate)
├── started_at (first attempt timestamp)
├── last_accessed_at (most recent attempt)
└── completed_at (when status became COMPLETED)
```

**Design Decisions:**

**Composite Primary Key (student_lesson_progress):**
- Implemented via `@IdClass(StudentLessonProgressId.class)`
- StudentLessonProgressId: Serializable class cu equals/hashCode
- Permite lookup efficient per (studentId, lessonId) pair

**Logical Foreign Keys (NO physical constraints):**
- `exercise_id` validated via Content Service REST API
- `lesson_id` validated via Content Service REST API
- **Database per Service pattern** - no cross-database FKs!

**JSONB pentru submitted_answer:**
- Flexible structure per exercise type (MULTIPLE_CHOICE, TRANSLATION, etc.)
- Example: `{"selectedOption": "A"}` sau `{"translation": "你好"}`
- Hibernate 6 native support: `@JdbcTypeCode(SqlTypes.JSON)`

**Indexes:**
```sql
CREATE INDEX idx_attempts_student_exercise ON exercise_attempts(student_id, exercise_id, submitted_at);
CREATE INDEX idx_attempts_exercise_correct ON exercise_attempts(exercise_id, is_correct);
CREATE INDEX idx_progress_student_status ON student_lesson_progress(student_id, status);
```

## Hybrid Integration Pattern

Progress Service foloseste **HYBRID approach** pentru data consistency:

### 1. Asynchronous (RabbitMQ Events) - Student Identity

**Source:** User Service publishes events  
**Pattern:** Eventual Consistency  
**Entities:** `students_replica` table

**Events Consumed:**
- `StudentCreatedEvent` → Insert student replica
- `StudentUpdatedEvent` → Update full_name, email
- `StudentDeletedEvent` → Delete student replica (cascade local data)

**Justification:**
- Student data changes RARELY (register, name update, delete)
- Eventual consistency acceptable (milliseconds delay tolerable)
- Reduces coupling cu User Service
- Prevents cascading failures (User Service down ≠ Progress Service down)

### 2. Synchronous (REST API) - Content Validation

**Target:** Content Service  
**Pattern:** Strong Consistency  
**Validated:** `exercise_id`, `lesson_id`

**API Calls:**
- `GET /api/content/exercises/{id}` → validate exercise exists + get contentData
- `GET /api/content/lessons/{id}` → get lesson details + exercises array

**Justification:**
- Content MUST exist la submit attempt (nu putem evalua exercitiu inexistent)
- Lesson MUST have valid exercises pentru completion calculation
- Strong consistency required (no stale exercise data)
- Content Service trebuie active anyway pentru platform functioning

### 3. Synchronous (REST API) - XP Awarding

**Target:** User Service  
**Pattern:** Best Effort (logged failure, continue anyway)  
**Operation:** Award XP cand lesson completed

**API Call:**
- `PUT /api/users/students/{id}/xp?xpToAdd={amount}` → add XP to student

**Error Handling:**
- Success: Student XP updated in User Service
- Failure: Logged error, XP stored in `student_lesson_progress.xp_awarded` (audit trail)
- **NO rollback** - lesson progress saved regardless (eventual consistency)

**Trade-off Matrix:**

| Data Type | Pattern | Consistency | Justification |
|-----------|---------|-------------|---------------|
| Student Identity | Async Events | Eventual | Rare changes, acceptable delay |
| Exercise Validation | Sync REST | Strong | Must exist to evaluate |
| Lesson Content | Sync REST | Strong | Needed for completion calc |
| XP Award | Sync REST (best effort) | Eventual | Audit trail in progress DB |

## RabbitMQ Event Consumption

### Queue Bindings:

**Exchange:** `user.events.exchange` (TopicExchange)

**Queues:**
- `progress.student.created.queue` → routing key: `student.created`
- `progress.student.updated.queue` → routing key: `student.updated`
- `progress.student.deleted.queue` → routing key: `student.deleted`

**Message Format:** JSON (Jackson2JsonMessageConverter)

### Event Handlers (@RabbitListener):

**StudentEventConsumer.handleStudentCreated():**
```java
@RabbitListener(queues = "${rabbitmq.queue.student-created}")
@Transactional
public void handleStudentCreated(StudentCreatedEvent event) {
    // Idempotency check: skip if already exists
    if (studentReplicaDao.existsByStudentId(event.getStudentId())) {
        log.info("Student {} already exists, skipping duplicate event", event.getStudentId());
        return;
    }
    
    // Create replica
    StudentReplica replica = new StudentReplica(
        event.getStudentId(),
        event.getFullName(),
        event.getEmail(),
        LocalDateTime.now()
    );
    studentReplicaDao.save(replica);
    log.info("Created student replica for studentId={}", event.getStudentId());
}
```

**Idempotency:** CRITICAL - events pot fi duplicate (RabbitMQ redelivery)  
**Transaction:** Each event handler wrapped in @Transactional (atomic save)

**StudentEventConsumer.handleStudentUpdated():**
```java
// Update if exists, ignore if not (student poate fi deleted intre timp)
Optional<StudentReplica> optional = studentReplicaDao.findById(event.getStudentId());
if (optional.isPresent()) {
    StudentReplica replica = optional.get();
    replica.setFullName(event.getFullName());
    replica.setEmail(event.getEmail());
    replica.setSyncedAt(LocalDateTime.now());
    studentReplicaDao.save(replica);
}
```

**StudentEventConsumer.handleStudentDeleted():**
```java
// Delete if exists (cascade deletes all progress data for student)
studentReplicaDao.deleteById(event.getStudentId());
log.info("Deleted student replica and all progress for studentId={}", event.getStudentId());
```

**Error Handling:**
- RabbitMQ auto-retry on failure (default 3 attempts)
- Permanent failures logged (requires manual intervention)
- Dead Letter Queue (DLQ) - future enhancement

## Evaluation Engine

Progress Service include motor de evaluare pentru **4 tipuri de exercitii**.

### evaluateMultipleChoice():

**Input:** `contentData`, `submittedAnswer`

**Logic:**
```java
String correctOption = (String) contentData.get("correctOption");
String selectedOption = (String) submittedAnswer.get("selectedOption");

// Null-check validation (CRITICAL!)
if (correctOption == null) {
    return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
}

if (selectedOption == null) {
    return new EvaluationResult(BigDecimal.ZERO, "No option selected");
}

// Evaluate
if (correctOption.equals(selectedOption)) {
    return new EvaluationResult(new BigDecimal("100"), "Correct!");
} else {
    return new EvaluationResult(BigDecimal.ZERO, 
        "Incorrect. The correct answer was: " + correctOption);
}
```

**Example:**
```
contentData: {"correctOption": "你好"}
submittedAnswer: {"selectedOption": "你好"}
Result: score=100, feedback="Correct!"
```

---

### evaluateTranslation():

**Input:** `contentData`, `submittedAnswer`

**Logic:**
```java
String correctTranslation = (String) contentData.get("correctTranslation");
List<String> alternatives = (List<String>) contentData.get("alternativeTranslations");
String userTranslation = (String) submittedAnswer.get("translation");

// Null-check validation
if (correctTranslation == null) {
    return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
}

if (userTranslation == null || userTranslation.trim().isEmpty()) {
    return new EvaluationResult(BigDecimal.ZERO, "No translation provided");
}

// Exact match
if (correctTranslation.equals(userTranslation)) {
    return new EvaluationResult(new BigDecimal("100"), "Perfect translation!");
}

// Alternative match
if (alternatives != null && alternatives.contains(userTranslation)) {
    return new EvaluationResult(new BigDecimal("100"), "Correct alternative translation!");
}

// Partial credit (simplified - could use Levenshtein distance)
if (userTranslation.contains(correctTranslation) || correctTranslation.contains(userTranslation)) {
    return new EvaluationResult(new BigDecimal("50"), 
        "Partially correct. Expected: " + correctTranslation);
}

return new EvaluationResult(BigDecimal.ZERO, 
    "Incorrect. Correct translation: " + correctTranslation);
```

**Example:**
```
contentData: {"correctTranslation": "谢谢", "alternativeTranslations": ["多谢"]}
submittedAnswer: {"translation": "多谢"}
Result: score=100, feedback="Correct alternative translation!"
```

---

### evaluateFillBlank():

**Input:** `contentData`, `submittedAnswer`

**Logic:**
```java
List<String> correctAnswers = (List<String>) contentData.get("correctAnswers");
List<String> userAnswers = (List<String>) submittedAnswer.get("answers");

// Validation
if (correctAnswers == null || correctAnswers.isEmpty()) {
    return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
}

if (userAnswers == null) {
    return new EvaluationResult(BigDecimal.ZERO, "No answers provided");
}

if (correctAnswers.size() != userAnswers.size()) {
    return new EvaluationResult(BigDecimal.ZERO, 
        "Invalid number of answers. Expected: " + correctAnswers.size());
}

// Compare each blank
int correct = 0;
for (int i = 0; i < correctAnswers.size(); i++) {
    if (correctAnswers.get(i).equalsIgnoreCase(userAnswers.get(i))) {
        correct++;
    }
}

// Calculate score
BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctAnswers.size())
        .setScale(2, BigDecimal.ROUND_HALF_UP);

String feedback = correct == correctAnswers.size() 
    ? "All correct!" 
    : String.format("You got %d out of %d correct", correct, correctAnswers.size());

return new EvaluationResult(score, feedback);
```

**Example:**
```
contentData: {"correctAnswers": ["是", "是"]}
submittedAnswer: {"answers": ["是", "不是"]}
Result: score=50.00, feedback="You got 1 out of 2 correct"
```

---

### evaluateMatching():

**Input:** `contentData`, `submittedAnswer`

**Logic:**
```java
List<Map<String, String>> correctPairs = (List<Map<String, String>>) contentData.get("pairs");
Map<String, String> userMatches = (Map<String, String>) submittedAnswer.get("matches");

// Validation
if (correctPairs == null || correctPairs.isEmpty()) {
    return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
}

if (userMatches == null || userMatches.isEmpty()) {
    return new EvaluationResult(BigDecimal.ZERO, "No matches provided");
}

// Compare pairs
int correct = 0;
for (Map<String, String> pair : correctPairs) {
    String left = pair.get("left");
    String correctRight = pair.get("right");
    String userRight = userMatches.get(left);

    if (correctRight != null && correctRight.equals(userRight)) {
        correct++;
    }
}

// Calculate score
BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctPairs.size())
        .setScale(2, BigDecimal.ROUND_HALF_UP);

String feedback = correct == correctPairs.size()
    ? "All pairs matched correctly!"
    : String.format("You matched %d out of %d pairs correctly", correct, correctPairs.size());

return new EvaluationResult(score, feedback);
```

**Example:**
```
contentData: {"pairs": [{"left": "你好", "right": "Hello"}, {"left": "再见", "right": "Goodbye"}]}
submittedAnswer: {"matches": {"你好": "Hello", "再见": "Goodbye"}}
Result: score=100.00, feedback="All pairs matched correctly!"
```

---

### Scoring Rules:

**is_correct Determination:**
```java
boolean isCorrect = score.compareTo(new BigDecimal("70")) >= 0;
```

**Threshold:** 70% = passing score  
**Justification:** Permite partial credit pentru exercitii complexe (FILL_BLANK, MATCHING)

## Lesson Progress Calculation

**Flow:** `submitAttempt()` → `updateLessonProgress()`

### Algorithm:

```java
private void updateLessonProgress(Long studentId, Long lessonId) {
    // 1. Fetch lesson from Content Service (includes exercises array)
    Map<String, Object> lesson = contentServiceClient.getLesson(lessonId);
    List<Map<String, Object>> exercises = (List<Map<String, Object>>) lesson.get("exercises");
    
    if (exercises == null || exercises.isEmpty()) {
        log.warn("Lesson {} has no exercises, skipping progress update", lessonId);
        return;
    }

    // 2. Extract exercise IDs
    List<Long> exerciseIds = exercises.stream()
            .map(ex -> ((Number) ex.get("id")).longValue())
            .collect(Collectors.toList());

    // 3. Count distinct correct exercises
    long completedCount = exerciseAttemptDao.countDistinctCorrectExercises(studentId, exerciseIds);
    
    // 4. Calculate completion percentage
    BigDecimal completionPct = BigDecimal.valueOf((completedCount * 100.0) / exercises.size())
            .setScale(2, BigDecimal.ROUND_HALF_UP);

    // 5. Fetch or create progress record
    StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
            .orElse(new StudentLessonProgress(studentId, lessonId));

    // 6. Set started_at if first attempt
    if (progress.getStartedAt() == null) {
        progress.setStartedAt(LocalDateTime.now());
    }

    // 7. Update fields
    progress.setCompletionPct(completionPct);
    progress.setLastAccessedAt(LocalDateTime.now());

    // 8. Status management logic
    if (completionPct.compareTo(new BigDecimal("100")) == 0) {
        // Lesson 100% complete
        
        if (!"COMPLETED".equals(progress.getStatus())) {
            // Just became completed
            progress.setStatus("COMPLETED");
            progress.setCompletedAt(LocalDateTime.now());

            // Award XP ONLY if not already awarded (CRITICAL: prevent duplicate XP!)
            if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
                int xpReward = ((Number) lesson.get("xpReward")).intValue();
                progress.setXpAwarded(xpReward);

                try {
                    userServiceClient.addStudentXp(studentId, xpReward);
                    log.info("Awarded {} XP to student {} for completing lesson {}", 
                             xpReward, studentId, lessonId);
                } catch (Exception e) {
                    log.error("Failed to award XP to student {}: {}", studentId, e.getMessage(), e);
                    // Continue anyway - XP saved in progress table for audit
                }
            } else {
                log.info("XP already awarded for lesson {}, skipping duplicate award", lessonId);
            }
        }
        
    } else if (completionPct.compareTo(BigDecimal.ZERO) > 0) {
        // Partially complete (0% < completion < 100%)
        
        if (!"IN_PROGRESS".equals(progress.getStatus())) {
            progress.setStatus("IN_PROGRESS");
            progress.setCompletedAt(null); // Clear completed timestamp
        }
        
    } else {
        // Not started (0% completion)
        progress.setStatus("NOT_STARTED");
        progress.setCompletedAt(null);
    }

    // 9. Save progress
    lessonProgressDao.save(progress);
    log.info("Updated lesson progress: completionPct={}, status={}", 
             completionPct, progress.getStatus());
}
```

### Custom DAO Query:

```java
// In IExerciseAttemptDao
@Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
       "WHERE ea.studentId = :studentId AND ea.exerciseId IN :exerciseIds " +
       "AND ea.isCorrect = true")
long countDistinctCorrectExercises(@Param("studentId") Long studentId, 
                                   @Param("exerciseIds") List<Long> exerciseIds);
```

**Logic:** Count UNIQUE exercises cu cel putin 1 attempt correct (retry-friendly).

### Duplicate XP Prevention:

**Scenario:** Teacher adds exercitii la lectie completata → status downgrade la IN_PROGRESS

**Solution:**
```java
if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
    // Award XP
} else {
    // Skip - XP already awarded
    log.info("XP already awarded, skipping duplicate");
}
```

**Result:** XP awarded ONCE per lesson, chiar daca lesson re-completed.

**Trade-off:** XP not revoked cand lesson becomes incomplete (acceptable - student earned it).

## API Endpoints

Toate rutele incep cu `/api/progress`.

### Exercise Attempts
```
POST /attempts                          -> Submit attempt (evaluate + update progress)
GET  /attempts/student/{studentId}/exercise/{exerciseId}
                                        -> Get all attempts for specific exercise
GET  /attempts/student/{studentId}/recent?limit=10
                                        -> Get recent attempts (any exercise)
```

### Lesson Progress
```
GET /lessons/student/{studentId}/lesson/{lessonId}
                                        -> Get progress for specific lesson
GET /lessons/student/{studentId}       -> Get all progress for student
GET /lessons/student/{studentId}/in-progress
                                        -> Get in-progress lessons only
GET /lessons/{lessonId}/leaderboard    -> Top 10 students by completion %
```

### Admin - Student Replica
```
GET /admin/students                    -> List all student replicas
GET /admin/students/{studentId}        -> Get student replica by ID
GET /admin/students/{studentId}/exists -> Check if student synced
```

### Health Check
```
GET /health                            -> Service health status
```

## Service Layer Logic

### ProgressService:

**submitAttempt(SubmitAttemptRequest):**
```java
1. Validate student exists in replica (throw if not)
2. Fetch exercise from Content Service (validate exists + get contentData)
3. Extract lessonId from exercise
4. Calculate attempt_number (count previous attempts + 1)
5. Evaluate answer based on exercise type (call evaluate* method)
6. Create ExerciseAttempt entity (save score, feedback, isCorrect)
7. Save attempt to database
8. Call updateLessonProgress() to recalculate completion
9. Return ExerciseAttemptDto
```

**Error Handling:**
- Student not found → `IllegalArgumentException` → 400 Bad Request
- Exercise not found → `IllegalArgumentException` → 400 Bad Request
- Content Service down → `IllegalArgumentException` → 400 Bad Request
- Evaluation error → score=0, feedback explains issue

---

**getLessonProgress(Long studentId, Long lessonId):**
```java
1. Fetch from student_lesson_progress table
2. If not found → throw IllegalArgumentException → 404 Not Found
3. Map to StudentLessonProgressDto
4. Return
```

**Alternative (optional enhancement):**
```java
// Return default NOT_STARTED if no record exists
.orElseGet(() -> new StudentLessonProgressDto(
    studentId, lessonId, "NOT_STARTED", BigDecimal.ZERO, null, null, null, null
));
```

---

**getAllProgressForStudent(Long studentId):**
```java
1. Fetch all progress records for student
2. Map to List<StudentLessonProgressDto>
3. Return (poate fi goala daca student nu a inceput nicio lectie)
```

---

**getInProgressLessons(Long studentId):**
```java
1. Fetch WHERE student_id = ? AND status = 'IN_PROGRESS'
2. Map to List<StudentLessonProgressDto>
3. Return
```

---

**getLessonLeaderboard(Long lessonId):**
```java
1. Fetch all progress for lesson, ORDER BY completion_pct DESC
2. LIMIT 10
3. Map to List<StudentLessonProgressDto>
4. Return
```

### StudentReplicaService:

**getAllStudents():**
```java
1. Fetch all from students_replica
2. Map to List<StudentReplicaDto>
3. Return
```

**getStudentById(Long studentId):**
```java
1. Fetch by ID
2. Return Optional<StudentReplicaDto>
```

**studentExists(Long studentId):**
```java
1. Check existsByStudentId()
2. Return boolean
```

### ContentServiceClient:

**getExercise(Long exerciseId):**
```java
String url = contentServiceUrl + "/api/content/exercises/" + exerciseId;
Map<String, Object> exercise = restTemplate.getForObject(url, Map.class);

if (exercise == null) {
    throw new IllegalArgumentException("Exercise not found: " + exerciseId);
}

return exercise;
```

**getLesson(Long lessonId):**
```java
String url = contentServiceUrl + "/api/content/lessons/" + lessonId;
Map<String, Object> lesson = restTemplate.getForObject(url, Map.class);

if (lesson == null) {
    throw new IllegalArgumentException("Lesson not found: " + lessonId);
}

return lesson; // MUST include "exercises" array!
```

### UserServiceClient:

**addStudentXp(Long studentId, int xpToAdd):**
```java
String url = String.format("%s/api/users/students/%d/xp?xpToAdd=%d", 
                           userServiceUrl, studentId, xpToAdd);

restTemplate.put(url, null);
log.info("Successfully added {} XP to student {}", xpToAdd, studentId);
```

**Error Handling:** Exceptions logged, not propagated (best effort).

## Configurare

### application.properties (Local):
```properties
server.port=8083

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/progress_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# RabbitMQ Consumer
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest

rabbitmq.queue.student-created=progress.student.created.queue
rabbitmq.queue.student-updated=progress.student.updated.queue
rabbitmq.queue.student-deleted=progress.student.deleted.queue
rabbitmq.exchange.user-events=user.events.exchange
rabbitmq.routing-key.student-created=student.created
rabbitmq.routing-key.student-updated=student.updated
rabbitmq.routing-key.student-deleted=student.deleted

# Microservices URLs (with fallback for local development)
content-service.url=${CONTENT_SERVICE_URL:http://localhost:8081}
user-service.url=${USER_SERVICE_URL:http://localhost:8082}
```

### Docker Environment Variables (override):
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://progress-database:5432/progress_database
  SPRING_DATASOURCE_USERNAME: postgres
  SPRING_DATASOURCE_PASSWORD: kuso
  
  SPRING_RABBITMQ_HOST: rabbitmq
  SPRING_RABBITMQ_PORT: 5672
  SPRING_RABBITMQ_USERNAME: guest
  SPRING_RABBITMQ_PASSWORD: guest
  
  CONTENT_SERVICE_URL: http://content-service:8081
  USER_SERVICE_URL: http://user-service:8082
  
  SPRING_JPA_HIBERNATE_DDL_AUTO: update
  SPRING_JPA_SHOW_SQL: "true"
```

### Setup DB Local:
```sql
CREATE DATABASE progress_database;
```

### Rulare Local:
```bash
mvn spring-boot:run
```

### Rulare Docker:
```bash
docker-compose up --build progress-service
```

## Decizii Arhitecturale (AI Context)

### Hybrid Integration Pattern:

**Decision:** Events pentru student identity, REST API pentru content validation + XP awarding

**Justification:**

**Student Identity (Events):**
- Changes rare (register, update name, delete)
- Eventual consistency tolerable (milliseconds delay acceptable)
- Decouples services (User Service down NU blocheaza Progress Service read operations)

**Content Validation (REST):**
- Content MUST exist pentru evaluare (cannot evaluate non-existent exercise)
- Lesson MUST have exercises array pentru completion calculation
- Strong consistency required (no stale exercise data)
- Content Service active anyway pentru platform functioning

**XP Awarding (REST - best effort):**
- Immediate feedback desired (student sees XP increase)
- Failure tolerable (XP stored in progress_database for audit)
- User Service down NU previne lesson completion tracking

**Trade-off Matrix:**

| Approach | Benefits | Drawbacks |
|----------|----------|-----------|
| All Events | Low coupling | Stale content data risk, complex validation |
| All REST API | Strong consistency | Tight coupling, cascading failures |
| Hybrid (current) | Best of both | Complexity in integration logic |

**Conclusion:** Hybrid = optimal pentru use case.

---

### Duplicate XP Prevention:

**Problem:** Teacher adauga exercitii la lectie completata → completion drops → student re-completes → XP awarded AGAIN

**Solution:** Track `xp_awarded` in progress table
```java
if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
    // Award XP (first time)
} else {
    // Skip (already awarded)
}
```

**Alternative rejected:** Revoke XP when lesson incomplete → frustrating UX, complex rollback logic

**Trade-off:** XP not revoked = student "keeps" earned XP even if lesson expanded

---

### Null-Check Validation in Evaluation:

**Decision:** TOATE metodele `evaluate*()` au null-checks pentru contentData si submittedAnswer

**Justification:**
- Frontend poate trimite payload gresit (typo: "translaton" vs "translation")
- Teacher poate crea exercitiu invalid (missing correctOption)
- Network errors pot corupe JSON

**Without null-checks:** NullPointerException → 500 Error → poor UX

**With null-checks:** score=0 + helpful feedback → user understands issue

**Example:**
```java
if (correctOption == null) {
    return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
}

if (selectedOption == null) {
    return new EvaluationResult(BigDecimal.ZERO, "No option selected");
}
```

---

### Retry-Friendly Progress Calculation:

**Decision:** Count DISTINCT correct exercises (not total correct attempts)

**Query:**
```sql
SELECT COUNT(DISTINCT exercise_id) 
FROM exercise_attempts 
WHERE student_id = ? AND exercise_id IN (?) AND is_correct = true
```

**Justification:**
- Student poate face multiple attempts la acelasi exercitiu
- Doar 1 attempt correct necesar pentru "completion"
- Encourages learning from mistakes (retry until correct)

**Alternative rejected:** Count total correct attempts → penalizeaza retries

---

### Composite Primary Key pentru student_lesson_progress:

**Decision:** `@IdClass(StudentLessonProgressId)` cu (studentId, lessonId)

**Justification:**
- Natural key = student + lesson (unic per combinatie)
- Efficient lookup pentru `findByStudentIdAndLessonId()`
- Previne duplicate progress records

**Trade-off:** Requires Serializable IdClass cu equals/hashCode boilerplate

**Alternative rejected:** Auto-increment ID + UNIQUE constraint → extra field, no real benefit

---

### Logical Foreign Keys (NO physical constraints):

**Decision:** `exercise_id`, `lesson_id` validated via REST API, NU physical FK in database

**Justification:**
- **Database per Service pattern** - cannot have cross-database FKs
- Content Service owns content data (source of truth)
- Progress Service = consumer, NU owner

**Validation Strategy:**
```java
// Before save attempt:
Map<String, Object> exercise = contentServiceClient.getExercise(exerciseId);
// Throws exception if not found → 400 Bad Request
```

**Trade-off:** No database-level referential integrity (relies on application logic)

---

### Event Idempotency:

**Decision:** Check `existsByStudentId()` before inserting in `handleStudentCreated()`

**Justification:**
- RabbitMQ poate redeliver messages (network issues, consumer crash)
- Duplicate events → duplicate student replicas → constraint violation

**Implementation:**
```java
if (studentReplicaDao.existsByStudentId(event.getStudentId())) {
    log.info("Student {} already exists, skipping", event.getStudentId());
    return; // Idempotent operation
}
```

**Alternative rejected:** Database UNIQUE constraint only → exception thrown, retry loop

---

### Lesson Status Transitions:

**Decision:** Status calculate based DOAR pe completion percentage
```
completionPct == 0    → NOT_STARTED
0 < completionPct < 100 → IN_PROGRESS
completionPct == 100  → COMPLETED
```

**Justification:**
- Deterministic (no manual status updates needed)
- Self-healing (status recalculated on every attempt)
- Handles lesson expansion (new exercises → status downgrades automatically)

**Transition Example:**
```
Initial: 1 exercise, 1 completed → 100% → COMPLETED
Teacher adds exercise → 1/2 completed → 50% → IN_PROGRESS (automatic downgrade)
Student completes new exercise → 2/2 → 100% → COMPLETED (automatic upgrade)
```

## Test Scenarios (Swagger)

### 1. Student Replica Sync (RabbitMQ):
```
1. Register student in User Service (POST /api/auth/register)
2. Wait 1-2 seconds (event processing)
3. GET /api/progress/admin/students
   → Verify: student replica exists
4. Update student name in User Service (PUT /api/users/1/name)
5. GET /api/progress/admin/students/1
   → Verify: fullName updated
```

### 2. Submit Attempt Flow:
```
1. Create lesson + exercise in Content Service
2. POST /api/progress/attempts
   {
     "studentId": 1,
     "exerciseId": 1,
     "submittedAnswer": {"selectedOption": "A"}
   }
3. Verify response:
   - attemptNumber = 1
   - isCorrect = true/false
   - score = 0-100
   - feedbackText present
4. GET /api/progress/lessons/student/1/lesson/1
   → Verify: status IN_PROGRESS, completionPct updated
```

### 3. Lesson Completion Flow:
```
1. Create lesson with 3 exercises
2. Submit attempt for exercise 1 (correct)
   → completionPct = 33.33%, status = IN_PROGRESS
3. Submit attempt for exercise 2 (correct)
   → completionPct = 66.67%, status = IN_PROGRESS
4. Submit attempt for exercise 3 (correct)
   → completionPct = 100.00%, status = COMPLETED
   → xpAwarded = {lesson.xpReward}
5. GET /api/users/students/1 (User Service)
   → Verify: xpTotal increased by xpReward
```

### 4. Retry Mechanism:
```
1. Submit attempt (WRONG answer)
   → attemptNumber = 1, score = 0
2. GET /api/progress/lessons/student/1/lesson/1
   → Verify: completionPct = 0% (no correct attempts yet)
3. Submit attempt (CORRECT answer)
   → attemptNumber = 2, score = 100
4. GET /api/progress/lessons/student/1/lesson/1
   → Verify: completionPct updated (counted as complete)
```

### 5. Null-Check Validation:
```
1. POST /api/progress/attempts
   {
     "studentId": 1,
     "exerciseId": 1,
     "submittedAnswer": {}  // Empty!
   }
2. Verify response:
   - score = 0
   - feedbackText = "No option selected" (not 500 error!)
```

### 6. Duplicate XP Prevention:
```
1. Complete lesson (3/3 exercises) → xpAwarded = 100
2. Teacher adds exercise 4 to same lesson
3. Submit attempt for exercise 1 again (triggers recalc)
   → completionPct = 75%, status = IN_PROGRESS
4. Submit attempt for exercise 4 (correct)
   → completionPct = 100%, status = COMPLETED
5. Verify: xpAwarded STILL = 100 (not 200!)
6. GET /api/users/students/1
   → Verify: xpTotal = 100 (no duplicate)
```

### 7. Leaderboard:
```
1. Register 3 students
2. Student 1: complete lesson 50%
3. Student 2: complete lesson 100%
4. Student 3: complete lesson 75%
5. GET /api/progress/lessons/{lessonId}/leaderboard
   → Verify: Order = [Student2, Student3, Student1]
```

### 8. Multiple Exercise Types:
```
1. Create MULTIPLE_CHOICE exercise → submit with {"selectedOption": "A"}
2. Create TRANSLATION exercise → submit with {"translation": "你好"}
3. Create FILL_BLANK exercise → submit with {"answers": ["是", "是"]}
4. Create MATCHING exercise → submit with {"matches": {"你好": "Hello"}}
5. Verify: All evaluate correctly based on type
```

## Known Issues & Limitations

**Current Implementation:**
- No pagination pe GET endpoints (leaderboard limited to 10, others unlimited)
- No filtering/sorting (except built-in ORDER BY)
- No caching pentru Content Service calls (REST calls pe fiecare submit)
- No circuit breaker pentru service calls (Content/User Service down → failures)
- Event retry policy basic (RabbitMQ default, no custom DLQ)
- No comprehensive error responses (exceptions → generic 400/500)

**Edge Cases Not Handled:**
- Content Service returns exercise WITHOUT lessonId → crash
- Lesson has 0 exercises → division by zero (mitigated by empty check)
- Very large lessons (100+ exercises) → performance issues (no lazy loading)
- Concurrent attempts from same student → possible duplicate attempt_number (rare)

**Future Enhancements:**
- Add Redis cache pentru exercises/lessons (reduce REST calls)
- Add circuit breaker pattern (Resilience4j) pentru service calls
- Add pagination: `GET /attempts?page=0&size=20`
- Add comprehensive error DTOs cu error codes
- Add Dead Letter Queue pentru failed events
- Add soft delete pentru audit trail
- Add performance monitoring (execution time tracking)
- Add UNIQUE constraint pe (student_id, exercise_id, attempt_number) pentru prevent race conditions

## Docker Configuration

**Dockerfile:** Multi-stage build cu Amazon Corretto 21 Alpine

**Dependencies:**
- progress-database (PostgreSQL 16)
- rabbitmq (RabbitMQ 3 Management)
- user-service (for XP awarding)
- content-service (for validation)
- Network: chinese-learning-network

**Ports:**
- Internal: 8083
- External: 8083

**Health Check:** Depends on progress-database healthy AND rabbitmq healthy

**Startup Order:**
1. PostgreSQL + RabbitMQ start + healthcheck pass
2. User Service + Content Service start
3. Progress Service starts (depends_on all above)

**Startup Behavior:**
- RabbitMQ down → Progress Service starts anyway (queues created when RabbitMQ available)
- Content Service down → Progress Service starts, but submit attempts fail (logged errors)
- User Service down → Progress Service works, XP awarding fails (logged errors)

---

**Context AI:** README conceput pentru LLM assistance cu focus pe hybrid integration pattern, evaluation engine logic, si event-driven architecture. Toate deciziile justificate cu trade-offs expliciti. Null-check validation documentata pentru robustness. Duplicate XP prevention mechanism critical pentru data integrity.