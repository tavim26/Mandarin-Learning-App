# Progress Service - Chinese Learning Platform

Microservice pentru Progress Tracking & Gamification in arhitectura distribuita. Gestioneaza exercise attempts, lesson progress, XP/level calculation si leaderboard queries.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA + JSONB support)
* **RestTemplate** pentru inter-service communication
* **Maven** + **SpringDoc OpenAPI**
* **Docker** + Amazon Corretto 21

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + evaluation engine + progress calculation
controller/   -> REST endpoints + Swagger docs
clients/      -> REST clients (ContentServiceClient, UserServiceClient)
```

**Reguli Implementare:**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod si comentarii (encoding safety)
- Comentarii DOAR cu // (INTERZIS /* ... */)
- Hibernate ddl-auto=update (schema auto-generata din entities)
- JSONB pentru flexibilitate submitted answers (Hibernate 6 @JdbcTypeCode)
- Controllers NU importa DAO (separation of concerns strict)

## Schema Baza de Date

**Database:** `progress_database` (postgres/kuso)  
**Port:** 8083  
**Swagger:** http://localhost:8083/swagger-ui/index.html

### Tabele si Relatii:

```dbml
Table "students_replica" {
  "student_id" BIGINT [pk]
  "xp_total" INTEGER [not null, default: 0]
  "level" INTEGER [not null, default: 1]
  
  Indexes {
    xp_total [name: "idx_students_xp_leaderboard"]
  }
}

Table "exercise_attempts" {
  "id" BIGINT [pk, increment]
  "student_id" BIGINT [not null]
  "exercise_id" BIGINT [not null]
  "attempt_number" INTEGER [not null]
  "submitted_at" TIMESTAMP [not null]
  "submitted_answer" JSONB [not null]
  "is_correct" BOOLEAN [not null]
  "score" NUMERIC(5,2) [not null]
  "feedback_text" TEXT
  
  Indexes {
    (student_id, exercise_id, submitted_at) [name: "idx_attempts_student_exercise"]
    (exercise_id, is_correct) [name: "idx_attempts_exercise_correct"]
  }
}

Table "student_lesson_progress" {
  "id" BIGINT [pk, increment]
  "student_id" BIGINT [not null]
  "lesson_id" BIGINT [not null]
  "status" VARCHAR(20) [not null]
  "completion_pct" NUMERIC(5,2) [not null, default: 0]
  "xp_awarded" INTEGER
  "started_at" TIMESTAMP
  "last_accessed_at" TIMESTAMP
  "completed_at" TIMESTAMP
  
  Indexes {
    (student_id, lesson_id) [name: "idx_progress_student_lesson"]
    (student_id, status) [name: "idx_progress_student_status"]
  }
}
```

**Design Principles:**

**students_replica:**
- Minimal schema: DOAR student_id, xp_total, level
- NU stocheaza full_name, email, nickname (identity data in User Service)
- Single Source of Truth: Progress Service owns XP/level, User Service owns identity
- Lazy creation: Replica creata DOAR la primul attempt submission

**Logical Foreign Keys:**
- `exercise_id`, `lesson_id` validated via Content Service REST API
- `student_id` validated via User Service REST API (la lazy creation)
- NO physical FK constraints (database per service pattern)

**JSONB pentru submitted_answer:**
- Flexible structure per exercise type
- MULTIPLE_CHOICE: `{"selectedIndex": 2}`
- TRANSLATION: `{"translation": "text"}`
- FILL_BLANK: `{"answers": ["ans1", "ans2"]}`
- MATCHING: `{"matches": {"left": "right"}}`

## Bounded Context (Domain-Driven Design)

**Progress Service = Progress Tracking & Gamification Domain**

### Responsibilities:
- Exercise attempt tracking (submission, evaluation, retry mechanism)
- Lesson progress calculation (completion %, status management)
- XP/level management (award XP la lesson completion, calculate level)
- Leaderboard queries (global XP ranking, per-lesson ranking)
- Student replica lazy creation (minimal identity cache)

### Out of Scope:
Progress Service NU gestioneaza:
- User authentication (JWT validation in API Gateway)
- Content creation (lessons, exercises in Content Service)
- Identity management (full_name, email in User Service)

## Lazy Creation Pattern

**Concept:** Student replica se creaza DOAR la primul attempt submission, NU la user registration.

**Flow:**
```
1. User Service: Student se inregistreaza (userId=42)
   -> NO communication cu Progress Service
   -> NO replica creata

2. Frontend: Student submits first attempt
   POST /api/progress/attempts {studentId: 42, exerciseId: 1, ...}

3. Progress Service: ensureStudentReplicaExists(42)
   - Check: EXISTS student_id=42 in students_replica?
   - If NO:
     a. Call User Service: GET /api/users/42
     b. Validate: role=STUDENT
     c. Create minimal replica: StudentReplica(studentId=42, xpTotal=0, level=1)
     d. Save to database
   - If YES: Continue with attempt processing

4. Process attempt normally
```

**Benefits:**
- No RabbitMQ infrastructure needed
- Replica created doar pentru studenti activi
- Always fresh data (User Service = source of truth)
- Simplifica arhitectura

**Implementation:**
```java
private void ensureStudentReplicaExists(Long studentId) {
    if (!studentReplicaDao.existsByStudentId(studentId)) {
        // Validate student exists in User Service
        userServiceClient.getUserById(studentId);  // Throws if not found
        
        // Create minimal replica
        StudentReplica replica = new StudentReplica(studentId);
        // Constructor sets: xpTotal=0, level=1
        studentReplicaDao.save(replica);
        
        log.info("Lazy-created student replica for studentId={}", studentId);
    }
}
```

## Evaluation Engine

Progress Service include motor de evaluare pentru **4 tipuri de exercitii**.

### Exercise Type 1: MULTIPLE_CHOICE

**ContentData Structure:**
```json
{
  "options": ["Unu", "Doi", "Trei", "Patru"],
  "correctIndex": 2
}
```

**SubmittedAnswer Structure:**
```json
{
  "selectedIndex": 2
}
```

**Evaluation Logic:**
```java
private EvaluationResult evaluateMultipleChoice(Map<String, Object> contentData,
                                                Map<String, Object> submittedAnswer) {
    List<String> options = (List<String>) contentData.get("options");
    Integer correctIndex = (Integer) contentData.get("correctIndex");
    Integer selectedIndex = (Integer) submittedAnswer.get("selectedIndex");

    // Null-check validation
    if (options == null || correctIndex == null) {
        return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
    }
    if (selectedIndex == null) {
        return new EvaluationResult(BigDecimal.ZERO, "No option selected");
    }

    // Evaluate
    if (correctIndex.equals(selectedIndex)) {
        return new EvaluationResult(new BigDecimal("100"), "Correct!");
    } else {
        String correctAnswer = options.get(correctIndex);
        return new EvaluationResult(BigDecimal.ZERO,
                "Incorrect. The correct answer was: " + correctAnswer);
    }
}
```

---

### Exercise Type 2: TRANSLATION

**ContentData Structure:**
```json
{
  "hint": "苹果 inseamna mar",
  "chineseText": "我喜欢吃苹果",
  "acceptedAnswers": [
    "Imi place sa mananc mere",
    "Mie imi plac merele"
  ]
}
```

**SubmittedAnswer Structure:**
```json
{
  "translation": "Imi place sa mananc mere"
}
```

**Evaluation Logic:**
```java
private EvaluationResult evaluateTranslation(Map<String, Object> contentData,
                                             Map<String, Object> submittedAnswer) {
    List<String> acceptedAnswers = (List<String>) contentData.get("acceptedAnswers");
    String userTranslation = (String) submittedAnswer.get("translation");

    // Null-check validation
    if (acceptedAnswers == null || acceptedAnswers.isEmpty()) {
        return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
    }
    if (userTranslation == null || userTranslation.trim().isEmpty()) {
        return new EvaluationResult(BigDecimal.ZERO, "No translation provided");
    }

    // Normalize for comparison (lowercase, trim)
    String normalizedUser = userTranslation.toLowerCase().trim();

    // Check against all accepted answers
    for (String accepted : acceptedAnswers) {
        if (accepted.toLowerCase().trim().equals(normalizedUser)) {
            return new EvaluationResult(new BigDecimal("100"), "Perfect translation!");
        }
    }

    // Partial credit: check if contains key words
    for (String accepted : acceptedAnswers) {
        String normalizedAccepted = accepted.toLowerCase().trim();
        if (normalizedUser.contains(normalizedAccepted) || 
            normalizedAccepted.contains(normalizedUser)) {
            return new EvaluationResult(new BigDecimal("50"),
                    "Partially correct. Expected: " + acceptedAnswers.get(0));
        }
    }

    return new EvaluationResult(BigDecimal.ZERO,
            "Incorrect. Correct translation: " + acceptedAnswers.get(0));
}
```

---

### Exercise Type 3: FILL_BLANK

**ContentData Structure:**
```json
{
  "sentence": "我___学生",
  "correctAnswers": ["是"]
}
```

**SubmittedAnswer Structure:**
```json
{
  "answers": ["是"]
}
```

**Evaluation Logic:**
```java
private EvaluationResult evaluateFillBlank(Map<String, Object> contentData,
                                           Map<String, Object> submittedAnswer) {
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
}
```

---

### Exercise Type 4: MATCHING

**ContentData Structure:**
```json
{
  "pairs": [
    {"left": "你好", "right": "Salut"},
    {"left": "再见", "right": "La revedere"},
    {"left": "谢谢", "right": "Multumesc"}
  ]
}
```

**SubmittedAnswer Structure:**
```json
{
  "matches": {
    "你好": "Salut",
    "再见": "La revedere",
    "谢谢": "Multumesc"
  }
}
```

**Evaluation Logic:**
```java
private EvaluationResult evaluateMatching(Map<String, Object> contentData,
                                          Map<String, Object> submittedAnswer) {
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
}
```

---

### Scoring Rules:

**isCorrect Determination:**
```java
boolean isCorrect = score.compareTo(new BigDecimal("70")) >= 0;
```

**Threshold:** 70% = passing score  
**Justification:** Permite partial credit pentru exercitii complexe (FILL_BLANK, MATCHING)

## Lesson Progress Calculation

**Trigger:** `submitAttempt()` -> `updateLessonProgress()`

### Algorithm:

```java
private void updateLessonProgress(Long studentId, Long lessonId) {
    // STEP 1: Fetch lesson from Content Service (includes exercises array)
    Map<String, Object> lesson = contentServiceClient.getLesson(lessonId);
    List<Map<String, Object>> exercises = (List<Map<String, Object>>) lesson.get("exercises");
    
    if (exercises == null || exercises.isEmpty()) {
        log.warn("Lesson {} has no exercises, skipping progress update", lessonId);
        return;
    }

    // STEP 2: Extract exercise IDs
    List<Long> exerciseIds = exercises.stream()
            .map(ex -> ((Number) ex.get("id")).longValue())
            .collect(Collectors.toList());

    // STEP 3: Count distinct correct exercises
    long correctCount = exerciseAttemptDao.countDistinctCorrectExercises(studentId, exerciseIds);
    
    // STEP 4: Calculate completion percentage
    BigDecimal completionPct = BigDecimal.valueOf((correctCount * 100.0) / exercises.size())
            .setScale(2, BigDecimal.ROUND_HALF_UP);

    // STEP 5: Fetch or create progress record
    StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
            .orElse(new StudentLessonProgress(studentId, lessonId));

    // STEP 6: Set started_at if first attempt
    if (progress.getStartedAt() == null) {
        progress.setStartedAt(LocalDateTime.now());
    }

    // STEP 7: Update fields
    progress.setCompletionPct(completionPct);
    progress.setLastAccessedAt(LocalDateTime.now());

    // STEP 8: Status management + XP award logic
    if (completionPct.compareTo(new BigDecimal("100")) == 0) {
        // Lesson 100% complete
        
        if (!"COMPLETED".equals(progress.getStatus())) {
            // Just became completed
            progress.setStatus("COMPLETED");
            progress.setCompletedAt(LocalDateTime.now());

            // Award XP ONLY if not already awarded (duplicate prevention)
            if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
                int xpReward = ((Number) lesson.get("xpReward")).intValue();
                progress.setXpAwarded(xpReward);

                // Update student replica XP + level
                awardXpToStudent(studentId, xpReward);

                log.info("Awarded {} XP to student {} for completing lesson {}",
                         xpReward, studentId, lessonId);
            } else {
                log.info("XP already awarded for lesson {}, skipping duplicate", lessonId);
            }
        }
        
    } else if (completionPct.compareTo(BigDecimal.ZERO) > 0) {
        // Partially complete (0% < completion < 100%)
        
        if (!"IN_PROGRESS".equals(progress.getStatus())) {
            progress.setStatus("IN_PROGRESS");
            progress.setCompletedAt(null);
        }
        
    } else {
        // Not started (0% completion)
        progress.setStatus("NOT_STARTED");
        progress.setCompletedAt(null);
    }

    // STEP 9: Save progress
    lessonProgressDao.save(progress);
}
```

### Custom DAO Query:

```java
@Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
       "WHERE ea.studentId = :studentId AND ea.exerciseId IN :exerciseIds " +
       "AND ea.isCorrect = true")
long countDistinctCorrectExercises(@Param("studentId") Long studentId, 
                                   @Param("exerciseIds") List<Long> exerciseIds);
```

**Logic:** Count UNIQUE exercises cu cel putin 1 attempt correct (retry-friendly).

### Duplicate XP Prevention:

**Scenario:** Teacher adauga exercitii la lectie completata -> status downgrade la IN_PROGRESS

**Solution:**
```java
if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
    // Award XP (first time)
    int xpReward = lesson.get("xpReward");
    progress.setXpAwarded(xpReward);
    awardXpToStudent(studentId, xpReward);
} else {
    // Skip - XP already awarded
    log.info("XP already awarded, skipping duplicate");
}
```

**Result:** XP awarded ONCE per lesson, chiar daca lesson re-completed.

## XP & Level Management

### XP Award Logic:

**Trigger:** Lesson 100% completion (toate exercitiile rezolvate corect)

**Flow:**
```java
private void awardXpToStudent(Long studentId, int xpToAdd) {
    StudentReplica student = studentReplicaDao.findById(studentId)
            .orElseThrow(() -> new IllegalArgumentException("Student replica not found"));

    // Add XP using business logic method
    student.addXp(xpToAdd);  // Calls recalculateLevel() internally

    studentReplicaDao.save(student);
    log.info("Student {} now has {} XP (level {})", 
             studentId, student.getXpTotal(), student.getLevel());
}
```

### Level Calculation Formula:

```java
public void recalculateLevel() {
    this.level = (this.xpTotal / 100) + 1;
}
```

**Examples:**
```
xpTotal = 0       -> level = 1
xpTotal = 50      -> level = 1
xpTotal = 99      -> level = 1
xpTotal = 100     -> level = 2
xpTotal = 199     -> level = 2
xpTotal = 200     -> level = 3
xpTotal = 1000    -> level = 11
```

**Design Choice:** 100 XP per level = ~3-5 lectii per level (assuming 20-30 XP/lesson)

**StudentReplica Entity:**
```java
@Entity
@Table(name = "students_replica")
public class StudentReplica {
    @Id
    @Column(name = "student_id")
    private Long studentId;  // NOT auto-increment
    
    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal;
    
    @Column(name = "level", nullable = false)
    private Integer level;

    public void addXp(Integer xpToAdd) {
        this.xpTotal += xpToAdd;
        recalculateLevel();
    }

    public void recalculateLevel() {
        this.level = (this.xpTotal / 100) + 1;
    }
}
```

## API Endpoints

Toate rutele incep cu `/api/progress`.

### Exercise Attempts
```
POST /attempts
  -> Submit attempt (evaluate + update progress)
  -> LAZY CREATES student replica on first attempt

GET /attempts/student/{studentId}/exercise/{exerciseId}
  -> Get all attempts for specific exercise (retry history)
```

### Lesson Progress
```
GET /lessons/student/{studentId}/lesson/{lessonId}
  -> Get progress for specific lesson

GET /lessons/student/{studentId}
  -> Get all progress for student

GET /lessons/student/{studentId}/in-progress
  -> Get in-progress lessons only

GET /lessons/{lessonId}/leaderboard
  -> Top 10 students by completion % for specific lesson
```

### Student Progress Summary
```
GET /students/leaderboard
  -> Top 10 students by total XP (global ranking)

GET /students/{studentId}
  -> Student XP & level summary

GET /students/{studentId}/exists
  -> Check if student replica exists

GET /students/admin/all
  -> All student replicas (admin/debugging)
```

## Service Layer Logic

### ProgressService:

**submitAttempt(SubmitAttemptRequest):**
```java
1. LAZY CREATION: ensureStudentReplicaExists(studentId)
2. Fetch exercise from Content Service (validate + get contentData)
3. Extract lessonId from exercise
4. Calculate attempt_number (count previous attempts + 1)
5. Evaluate answer based on exercise type (call EvaluationService)
6. Determine isCorrect (score >= 70)
7. Create ExerciseAttempt entity (save to DB)
8. Update lesson progress (completion % + XP award if needed)
9. Return ExerciseAttemptDto
```

**Error Handling:**
- Student not found in User Service -> IllegalArgumentException -> 400 Bad Request
- Exercise not found in Content Service -> IllegalArgumentException -> 400 Bad Request
- Evaluation error -> score=0, feedback explains issue

---

**updateLessonProgress(Long studentId, Long lessonId):**
```java
1. Fetch lesson from Content Service (get exercises array)
2. Extract exercise IDs
3. Count distinct correct exercises (DAO custom query)
4. Calculate completion percentage
5. Fetch or create progress record
6. Set started_at if first attempt
7. Update completion_pct, last_accessed_at
8. Status management:
   - 100% -> COMPLETED (award XP if not already awarded)
   - 0% < x < 100% -> IN_PROGRESS
   - 0% -> NOT_STARTED
9. Save progress
```

---

**ensureStudentReplicaExists(Long studentId):**
```java
1. Check: EXISTS student_id in students_replica?
2. If NO:
   a. Call User Service: GET /api/users/{id}
   b. Validate response (throws if user not found or not STUDENT)
   c. Create minimal replica: StudentReplica(studentId, xpTotal=0, level=1)
   d. Save to database
3. If YES: Do nothing (replica already exists)
```

---

### EvaluationService:

**evaluate(String exerciseType, Map contentData, Map submittedAnswer):**
```java
switch (exerciseType) {
    case "MULTIPLE_CHOICE": return evaluateMultipleChoice(...);
    case "TRANSLATION": return evaluateTranslation(...);
    case "FILL_BLANK": return evaluateFillBlank(...);
    case "MATCHING": return evaluateMatching(...);
    default: return new EvaluationResult(0, "Unknown exercise type");
}
```

**EvaluationResult inner class:**
```java
public static class EvaluationResult {
    private final BigDecimal score;  // 0-100
    private final String feedback;   // Human-readable message
}
```

---

### StudentReplicaService:

**getLeaderboard():**
```java
PageRequest pageRequest = PageRequest.of(0, 10, Sort.by(DESC, "xpTotal"));
return studentReplicaDao.findAll(pageRequest).map(this::mapToDto);
```

**Purpose:** Top 10 students by XP (global ranking)

## DTOs

### SubmitAttemptRequest:
```java
{
  "studentId": Long,
  "exerciseId": Long,
  "submittedAnswer": Map<String, Object>  // JSONB flexible structure
}
```

### ExerciseAttemptDto:
```java
{
  "id": Long,
  "studentId": Long,
  "exerciseId": Long,
  "attemptNumber": Integer,
  "submittedAt": LocalDateTime,
  "submittedAnswer": Map<String, Object>,
  "isCorrect": Boolean,
  "score": BigDecimal,
  "feedbackText": String
}
```

### StudentLessonProgressDto:
```java
{
  "id": Long,
  "studentId": Long,
  "lessonId": Long,
  "status": String,  // NOT_STARTED, IN_PROGRESS, COMPLETED
  "completionPct": BigDecimal,
  "xpAwarded": Integer,
  "startedAt": LocalDateTime,
  "lastAccessedAt": LocalDateTime,
  "completedAt": LocalDateTime
}
```

### StudentReplicaDto:
```java
{
  "studentId": Long,
  "xpTotal": Integer,
  "level": Integer
}
```

## Integration cu Alte Servicii

### Content Service Dependencies:

**Endpoints consumate:**
1. `GET /api/content/exercises/{id}` - Validate exercise exists + get contentData
2. `GET /api/content/lessons/{id}` - Get lesson + exercises array

**Usage:**
```
submitAttempt() flow:
1. Fetch exercise: GET /api/content/exercises/1
   Response: {id, lessonId, type, contentData}
2. Evaluate answer based on contentData
3. Update lesson progress: GET /api/content/lessons/1
   Response: {id, xpReward, exercises: [{id, type}, ...]}
4. Calculate completion % from exercises array
```

**Error Handling:**
- Content Service down -> IllegalArgumentException -> 400 Bad Request
- Invalid exercise structure -> score=0, feedback="Invalid exercise configuration"

---

### User Service Dependencies:

**Endpoint consumat:** `GET /api/users/{id}`

**Usage:** Lazy student replica creation
```
ensureStudentReplicaExists(42) flow:
1. Check: EXISTS student_id=42 in students_replica?
2. If NO -> Call User Service: GET /api/users/42
3. Validate: response.role == "STUDENT"
4. Create replica: StudentReplica(42, xpTotal=0, level=1)
```

**Response Expected:**
```json
{
  "id": 42,
  "fullName": "John Doe",
  "role": "STUDENT"
}
```

**Error Handling:**
- User not found -> 404 -> IllegalArgumentException
- User is not STUDENT -> IllegalArgumentException

---

### Frontend Dependencies:

**Data Assembly Pattern:**
Frontend face JOIN pentru display data:

```
Frontend calls:
1. GET /api/progress/students/leaderboard
   Response: [{studentId: 42, xpTotal: 150, level: 2}, ...]

2. FOR EACH studentId -> GET /api/users/{studentId}
   Response: {fullName: "John Doe", nickname: "DragonSlayer"}

3. Merge data:
   [{rank: 1, name: "DragonSlayer", xp: 150, level: 2}, ...]
```

**Justification:** Single Source of Truth - identity data in User Service, progress data in Progress Service

## Decizii Arhitecturale

### 1. Minimal Student Replica

**Decision:** students_replica contine DOAR student_id, xp_total, level

**Justification:**
- Single Source of Truth: User Service owns identity (full_name, email, nickname)
- No data duplication -> no stale data issues
- Clean bounded context: Progress Service manages ONLY progress domain
- Frontend responsibility: JOIN student names from User Service when displaying

**Alternative rejected:** Store full_name, email in replica -> data duplication, sync issues

---

### 2. Lazy Creation Pattern

**Decision:** Student replica created on FIRST attempt, NOT at registration

**Justification:**
- No RabbitMQ infrastructure needed
- Replica created doar pentru studenti activi
- On-demand validation (always fresh data from User Service)
- Simplifica arhitectura (no event-driven complexity)

**Flow Comparison:**
```
Event-Driven (rejected):
User registers -> Publish event -> Progress Service consumes -> Create replica
Problem: Overhead pentru studenti care NU folosesc platforme

Lazy Creation (current):
User registers -> NO action in Progress Service
Student submits first attempt -> Create replica NOW
Benefit: Overhead doar pentru studenti activi
```

---

### 3. Level Calculation Formula

**Decision:** `level = (xpTotal / 100) + 1`

**Justification:**
- Simple, predictable progression
- 100 XP per level = ~3-5 lectii per level (assuming 20-30 XP/lesson)
- Linear scaling (usor de inteles pentru studenti)

**Examples:**
```
Complete 3 lectii (60 XP) -> level 1
Complete 5 lectii (100 XP) -> level 2
Complete 10 lectii (200 XP) -> level 3
```

**Alternative considered:** Exponential scaling (like RPG games) -> rejected pentru simplitate

---

### 4. Duplicate XP Prevention

**Problem:** Teacher adauga exercitii la lectie completata -> completion drops -> student re-completes

**Solution:** Track `xp_awarded` in progress table
```java
if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
    // Award XP (first time)
    progress.setXpAwarded(xpReward);
    awardXpToStudent(studentId, xpReward);
} else {
    // Skip (already awarded)
    log.info("XP already awarded, skipping duplicate");
}
```

**Result:** XP awarded ONCE per lesson, chiar daca lesson expanded si re-completed

**Trade-off:** XP not revoked when lesson becomes incomplete (acceptable - student earned it)

---

### 5. Retry-Friendly Progress Calculation

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

**Alternative rejected:** Count total correct attempts -> penalizeaza retries

---

### 6. JSONB for Submitted Answers

**Decision:** `submitted_answer` stored as JSONB (flexible structure)

**Justification:**
- Different exercise types need different answer formats
- No schema migration needed when adding new exercise types
- PostgreSQL native support pentru JSON queries

**Examples:**
```json
MULTIPLE_CHOICE: {"selectedIndex": 2}
TRANSLATION: {"translation": "text"}
FILL_BLANK: {"answers": ["ans1", "ans2"]}
MATCHING: {"matches": {"key": "value"}}
```

---

### 7. Synchronous REST Integration

**Decision:** REST API calls pentru Content/User Service validation (nu event-driven)

**Justification:**
- Content MUST exist pentru evaluare (cannot evaluate non-existent exercise)
- Strong consistency required (no stale exercise data)
- Content Service active anyway pentru platform functioning
- Lazy creation = ONE-TIME call per student (acceptable overhead)

**Trade-off:** Tight coupling (Progress Service depends on other services availability)

**Mitigation:** Error handling + logging (graceful degradation)

---

### 8. Lesson Status Transitions

**Decision:** Status calculate AUTOMAT based pe completion percentage
```
completionPct == 0    -> NOT_STARTED
0 < completionPct < 100 -> IN_PROGRESS
completionPct == 100  -> COMPLETED
```

**Justification:**
- Deterministic (no manual status updates needed)
- Self-healing (status recalculated on every attempt)
- Handles lesson expansion (new exercises -> status downgrades automatically)

**Transition Example:**
```
Initial: 2 exercises, 2 completed -> 100% -> COMPLETED
Teacher adds exercise 3 -> 2/3 completed -> 66.67% -> IN_PROGRESS (automatic)
Student completes exercise 3 -> 3/3 -> 100% -> COMPLETED (automatic)
```

## Configurare

### application.properties (Local):
```properties
server.port=8083

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/progress_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Microservices URLs
content-service.url=${CONTENT_SERVICE_URL:http://localhost:8081}
user-service.url=${USER_SERVICE_URL:http://localhost:8082}
```

### Docker Environment Variables (override):
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://progress-database:5432/progress_database
  SPRING_DATASOURCE_USERNAME: postgres
  SPRING_DATASOURCE_PASSWORD: kuso
  
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

## Example Flows

### Flow 1: First Attempt (Lazy Creation + Evaluation)

```
POST /api/progress/attempts
{
  "studentId": 1,
  "exerciseId": 1,
  "submittedAnswer": {"selectedIndex": 2}
}

Progress Service Operations:
1. ensureStudentReplicaExists(1)
   - Check: EXISTS student_id=1? -> NO
   - Call: GET http://user-service:8082/api/users/1
   - Response: {id: 1, fullName: "John", role: "STUDENT"}
   - Create: StudentReplica(1, xpTotal=0, level=1)
   - Save to progress_database

2. Fetch exercise: GET http://content-service:8081/api/content/exercises/1
   Response: {
     id: 1,
     lessonId: 1,
     type: "MULTIPLE_CHOICE",
     contentData: {options: [...], correctIndex: 2}
   }

3. Calculate attempt_number:
   COUNT WHERE student_id=1 AND exercise_id=1 -> 0
   attempt_number = 0 + 1 = 1

4. Evaluate answer:
   evaluateMultipleChoice(contentData, submittedAnswer)
   -> selectedIndex=2 matches correctIndex=2
   -> EvaluationResult(score=100, feedback="Correct!")

5. Create ExerciseAttempt:
   INSERT INTO exercise_attempts
   (student_id=1, exercise_id=1, attempt_number=1, 
    submitted_answer='{"selectedIndex":2}', is_correct=true, 
    score=100, feedback_text="Correct!")

6. Update lesson progress:
   - Fetch lesson: GET http://content-service:8081/api/content/lessons/1
     Response: {id: 1, xpReward: 20, exercises: [{id:1}, {id:2}]}
   - Count distinct correct: 1 out of 2 exercises
   - Completion: 50%
   - Status: IN_PROGRESS
   - Save to student_lesson_progress

Response: ExerciseAttemptDto with all fields populated
```

---

### Flow 2: Lesson Completion (XP Award + Level Up)

```
Context:
- Lesson 1 has 2 exercises (IDs: 1, 2)
- Student 1 already completed exercise 1 (50%)
- xpReward for lesson 1 = 20
- Student current: xpTotal=0, level=1

POST /api/progress/attempts
{
  "studentId": 1,
  "exerciseId": 2,
  "submittedAnswer": {"selectedIndex": 1}
}

Progress Service Operations:
1. ensureStudentReplicaExists(1) -> Already exists, skip

2. Fetch exercise 2, evaluate, save attempt (correct)

3. Update lesson progress:
   - Fetch lesson: exercises=[{id:1}, {id:2}]
   - Count distinct correct: 2 out of 2
   - Completion: 100%
   - Status: COMPLETED
   - Check xp_awarded: NULL (not awarded yet)
   
   Award XP:
   - Set progress.xpAwarded = 20
   - Call awardXpToStudent(1, 20)
     * student.xpTotal = 0 + 20 = 20
     * student.level = (20 / 100) + 1 = 1 (no level up yet)
     * Save StudentReplica
   
   - Set progress.completedAt = NOW()
   - Save StudentLessonProgress

Response: ExerciseAttemptDto + Log: "Awarded 20 XP to student 1"
```

---

### Flow 3: Retry Mechanism

```
POST /api/progress/attempts (WRONG answer)
{
  "studentId": 1,
  "exerciseId": 1,
  "submittedAnswer": {"selectedIndex": 0}
}

Operations:
1. Calculate attempt_number: 1 (first try)
2. Evaluate: score=0, feedback="Incorrect. Correct answer was: Trei"
3. Save attempt: is_correct=false
4. Update progress: completionPct=0% (no correct exercises yet)

POST /api/progress/attempts (CORRECT answer)
{
  "studentId": 1,
  "exerciseId": 1,
  "submittedAnswer": {"selectedIndex": 2}
}

Operations:
1. Calculate attempt_number: 2 (retry)
2. Evaluate: score=100, feedback="Correct!"
3. Save attempt: is_correct=true
4. Update progress:
   - Count distinct correct: 1 exercise (ignores previous failed attempt)
   - Completion updated based on NEW correct count
```

---

### Flow 4: Leaderboard Query (Frontend JOIN)

```
GET /api/progress/students/leaderboard

Progress Service Response:
[
  {studentId: 17, xpTotal: 250, level: 3},
  {studentId: 42, xpTotal: 180, level: 2},
  {studentId: 99, xpTotal: 120, level: 2}
]

Frontend Operations:
1. FOR EACH studentId in leaderboard:
   GET /api/users/{studentId}
   
2. Responses:
   - User 17: {fullName: "Alice", nickname: "DragonSlayer"}
   - User 42: {fullName: "Bob", nickname: null}
   - User 99: {fullName: "Charlie", nickname: "TechNinja"}

3. Merge data:
   [
     {rank: 1, name: "DragonSlayer", xp: 250, level: 3},
     {rank: 2, name: "Bob", xp: 180, level: 2},
     {rank: 3, name: "TechNinja", xp: 120, level: 2}
   ]

Trade-off: N+1 queries, dar acceptable pentru top 10 leaderboard
```

## Test Scenarios (Swagger)

### 1. Lazy Creation Test:
```
1. GET /api/progress/students/1/exists
   -> Expected: false (no replica yet)

2. POST /api/progress/attempts {studentId: 1, exerciseId: 1, ...}
   -> Verify: Log message "Lazy-created student replica for studentId=1"
   -> Verify: Response contains attemptNumber=1

3. GET /api/progress/students/1/exists
   -> Expected: true (replica created)

4. GET /api/progress/students/1
   -> Expected: {studentId: 1, xpTotal: 0, level: 1}
```

---

### 2. Lesson Completion Flow:
```
Context: Lesson 1 has 3 exercises, xpReward=100

1. Submit exercise 1 (correct)
   GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: 33.33, status: IN_PROGRESS, xpAwarded: null

2. Submit exercise 2 (correct)
   GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: 66.67, status: IN_PROGRESS, xpAwarded: null

3. Submit exercise 3 (correct)
   GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: 100.00, status: COMPLETED, xpAwarded: 100
   
   GET /api/progress/students/1
   -> xpTotal: 100, level: 2  (level up!)
```

---

### 3. Duplicate XP Prevention:
```
1. Student completes lesson 1 (xpAwarded=100)

2. Teacher adds exercise 4 to lesson 1

3. Submit exercise 4 (correct)
   GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: 100.00, xpAwarded: 100 (UNCHANGED)
   
   GET /api/progress/students/1
   -> xpTotal: 100 (UNCHANGED - no duplicate XP)
```

---

### 4. Retry Mechanism:
```
1. Submit attempt (WRONG)
   -> attemptNumber: 1, isCorrect: false, score: 0

2. GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: 0% (no correct attempts yet)

3. Submit attempt (CORRECT)
   -> attemptNumber: 2, isCorrect: true, score: 100

4. GET /api/progress/lessons/student/1/lesson/1
   -> completionPct: updated (counts this exercise as complete)
```

---

### 5. Leaderboard:
```
1. Create 3 students, complete different lessons
   - Student 1: 250 XP (level 3)
   - Student 2: 180 XP (level 2)
   - Student 3: 50 XP (level 1)

2. GET /api/progress/students/leaderboard
   -> Expected: Ordered DESC by xpTotal
   [
     {studentId: 1, xpTotal: 250, level: 3},
     {studentId: 2, xpTotal: 180, level: 2},
     {studentId: 3, xpTotal: 50, level: 1}
   ]
```

## Known Limitations

**Current Implementation:**
- No pagination pe GET endpoints (leaderboard limited to 10, others unlimited)
- No filtering/sorting (except built-in ORDER BY)
- No caching pentru Content Service calls (REST calls pe fiecare submit)
- No circuit breaker pentru service calls (Content/User Service down -> failures)
- No comprehensive error responses (exceptions -> generic 400/500)

**Edge Cases Not Handled:**
- Content Service returns exercise WITHOUT lessonId -> crash
- Lesson has 0 exercises -> logged warning, progress update skipped
- Very large lessons (100+ exercises) -> performance issues (no lazy loading)
- Concurrent attempts from same student -> possible duplicate attempt_number (rare)

**Future Enhancements:**
- Add Redis cache pentru exercises/lessons (reduce REST calls)
- Add circuit breaker pattern (Resilience4j) pentru service calls
- Add pagination: `GET /attempts?page=0&size=20`
- Add comprehensive error DTOs cu error codes
- Add performance monitoring (execution time tracking)
- Add UNIQUE constraint pe (student_id, exercise_id, attempt_number) pentru prevent race conditions
- Add soft delete pentru audit trail

## Docker Configuration

**Dockerfile:** Multi-stage build cu Amazon Corretto 21 Alpine

**Dependencies:**
- progress-database (PostgreSQL 16)
- user-service (for student validation)
- content-service (for exercise/lesson validation)
- Network: chinese-learning-network

**Ports:**
- Internal: 8083
- External: 8083

**Health Check:** Depends on progress-database healthy

**Startup Order:**
1. PostgreSQL starts + healthcheck pass
2. User Service + Content Service start
3. Progress Service starts (depends_on all above)

**Startup Behavior:**
- Content Service down -> Progress Service starts, but submit attempts fail (logged errors)
- User Service down -> Progress Service works pentru studenti existenti, lazy creation fails

## AI Agent Quick Reference

**Service Identity:**
- Name: Progress Service
- Domain: Progress Tracking & Gamification
- Database: progress_database
- Port: 8083
- Tech Stack: Java 21, Spring Boot 4, PostgreSQL 16, JSONB

**Core Responsibilities:**
- Exercise attempt tracking (submission, evaluation, retry)
- Lesson progress calculation (completion %, status)
- XP/level management (award XP at lesson completion)
- Student replica lazy creation (minimal identity cache)
- Leaderboard queries (global XP ranking, per-lesson ranking)

**Key Integration Points:**
- Calls Content Service: GET /exercises/{id}, GET /lessons/{id}
- Calls User Service: GET /users/{id} (lazy creation only)
- Pattern: Synchronous REST API (on-demand validation)
- No event publishing (no RabbitMQ)

**Database Schema:**
- students_replica (student_id PK, xp_total, level)
- exercise_attempts (id PK, student_id, exercise_id, attempt_number, submitted_answer JSONB, is_correct, score, feedback_text)
- student_lesson_progress (id PK, student_id, lesson_id, status, completion_pct, xp_awarded, timestamps)

**Critical Implementation Details:**
- Lazy creation: Replica created on FIRST attempt, NOT at registration
- Level formula: (xpTotal / 100) + 1
- XP award: ONCE per lesson (duplicate prevention via xp_awarded field)
- Progress calculation: COUNT DISTINCT correct exercises (retry-friendly)
- Evaluation engine: 4 exercise types (MULTIPLE_CHOICE, TRANSLATION, FILL_BLANK, MATCHING)

**Data Ownership:**
- Owns: XP, level, attempts, lesson progress
- Does NOT own: Student identity (full_name, email, nickname in User Service)
- Frontend responsibility: JOIN student names from User Service for display

**Typical Usage by AI Agent:**
When implementing new features:
1. Check if feature is Progress-related -> Progress Service
2. Integration: Use REST API for Content/User Service validation
3. No data duplication (Single Source of Truth per domain)
4. Remember: students_replica = minimal cache, identity in User Service