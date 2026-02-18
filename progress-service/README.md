# Progress Service - Chinese Learning Platform

Microservice pentru **Progress Tracking & Gamification**. Gestioneaza exercise attempts, lesson progress, XP/level calculation, evaluation engine si leaderboard queries.

## Stack Tehnologic

**Java 21** + **Spring Boot 4.0.0** + **PostgreSQL 16+** (JSONB) + **RestTemplate** + **Maven** + **Docker**

## Schema Baza de Date

**Database:** `progress_database` | **Port:** 8083

```dbml
Table "students_replica" {
  "student_id" BIGINT [pk]
  "xp_total" INTEGER [not null, default: 0]
  "level" INTEGER [not null, default: 1]
  Indexes { xp_total [name: "idx_students_xp_leaderboard"] }
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
    (student_id, exercise_id, submitted_at)
    (exercise_id, is_correct)
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
    (student_id, lesson_id)
    (student_id, status)
  }
}
```

**Key Points:**
- `students_replica`: DOAR student_id, xp_total, level (NU stocheaza full_name, email - acestea in User Service)
- `exercise_id`, `lesson_id`: Logical FKs (validated via Content Service REST API)
- `submitted_answer`: JSONB pentru flexibility (different exercise types)

## Bounded Context

**Domain:** Progress Tracking & Gamification

**Owns:**
- Exercise attempts (submission, evaluation, retry tracking)
- Lesson progress (completion %, status: NOT_STARTED/IN_PROGRESS/COMPLETED)
- XP/level management (award XP la lesson completion, calculate level)
- Student replica (minimal cache: student_id, xp_total, level)

**Does NOT Own:**
- Student identity (full_name, email, nickname in User Service)
- Exercise/Lesson content (contentData in Content Service)

## Lazy Creation Pattern

**Concept:** Student replica se creaza la PRIMUL attempt, NU la registration.

**Flow:**
```
1. User registers in User Service -> NO action in Progress Service
2. Student submits first attempt -> Progress Service checks: EXISTS student_id?
3. If NO:
   - Call User Service: GET /api/users/{id}
   - Validate role=STUDENT
   - Create: StudentReplica(studentId, xpTotal=0, level=1)
4. Process attempt normally
```

**Benefits:** No RabbitMQ needed, replica doar pentru studenti activi, always fresh data from User Service.

## Evaluation Engine

**4 Exercise Types:**

**MULTIPLE_CHOICE:**
- ContentData: `{options: [...], correctIndex: 2}`
- SubmittedAnswer: `{selectedIndex: 2}`
- Logic: Match selectedIndex with correctIndex

**TRANSLATION:**
- ContentData: `{acceptedAnswers: ["Imi place...", "Mie imi plac..."]}`
- SubmittedAnswer: `{translation: "text"}`
- Logic: Check against all accepted answers (case-insensitive)

**FILL_BLANK:**
- ContentData: `{correctAnswers: ["ans1", "ans2"]}`
- SubmittedAnswer: `{answers: ["ans1", "ans2"]}`
- Logic: Compare each blank, partial credit possible

**MATCHING:**
- ContentData: `{pairs: [{left: "你好", right: "Salut"}, ...]}`
- SubmittedAnswer: `{matches: {"你好": "Salut", ...}}`
- Logic: Count correct pairs

**Scoring:** `isCorrect = (score >= 70)`

## Lesson Progress Calculation

**Trigger:** After each attempt submission

**Algorithm:**
```
1. Fetch lesson from Content Service (get exercises array)
2. Count DISTINCT correct exercises by student
3. Calculate: completionPct = (correct / total) * 100
4. Update status:
   - 100% -> COMPLETED (award XP if not already awarded)
   - 0-99% -> IN_PROGRESS
   - 0% -> NOT_STARTED
```

**Duplicate XP Prevention:**
```java
if (progress.xpAwarded == null || progress.xpAwarded == 0) {
    // Award XP (first time)
    progress.xpAwarded = xpReward;
    awardXpToStudent(studentId, xpReward);
} else {
    // Skip (already awarded)
}
```

## XP & Level Management

**Level Formula:**
```java
level = (xpTotal / 100) + 1
```

**Examples:**
- 0-99 XP -> level 1
- 100-199 XP -> level 2
- 200-299 XP -> level 3

**XP Award Trigger:** Lesson 100% completion (toate exercitiile rezolvate corect)

**Implementation:**
```java
public void addXp(Integer xpToAdd) {
    this.xpTotal += xpToAdd;
    this.level = (this.xpTotal / 100) + 1;  // Recalculate level
}
```

## API Endpoints

**Base:** `/api/progress`

### Exercise Attempts
```
POST   /attempts                                    -> Submit (lazy creates student)
GET    /attempts/student/{studentId}/exercise/{exerciseId}  -> Retry history
```

### Lesson Progress
```
GET    /lessons/student/{studentId}/lesson/{lessonId}  -> Specific lesson progress
GET    /lessons/student/{studentId}                    -> All progress
GET    /lessons/student/{studentId}/in-progress        -> In-progress only
GET    /lessons/{lessonId}/leaderboard                 -> Top 10 by completion %
```

### Student Progress Summary
```
GET    /students/leaderboard            -> Top 10 by XP (global)
GET    /students/{studentId}            -> XP & level
GET    /students/{studentId}/exists     -> Check replica exists
GET    /students/admin/all              -> All replicas (admin)
```

## Service Layer Logic

**ProgressService.submitAttempt():**
1. LAZY CREATION: ensureStudentReplicaExists()
2. Fetch exercise from Content Service (validate + get contentData)
3. Calculate attempt_number (count + 1)
4. Evaluate answer (call EvaluationService)
5. Save ExerciseAttempt
6. Update lesson progress (completion % + XP award if needed)

**ProgressService.updateLessonProgress():**
1. Fetch lesson + exercises array from Content Service
2. Count distinct correct exercises
3. Calculate completion %
4. Update status (NOT_STARTED/IN_PROGRESS/COMPLETED)
5. Award XP if 100% complete AND not already awarded

**EvaluationService.evaluate():**
- Switch on exerciseType (MULTIPLE_CHOICE/TRANSLATION/FILL_BLANK/MATCHING)
- Return EvaluationResult(score, feedback)

## Integration cu Alte Servicii

**Content Service:**
- `GET /api/content/exercises/{id}` -> Validate + get contentData
- `GET /api/content/lessons/{id}` -> Get exercises array + xpReward

**User Service:**
- `GET /api/users/{id}` -> Validate student exists (lazy creation only)

**Pattern:** Synchronous REST API calls (no event-driven)

## DTOs

**SubmitAttemptRequest:**
```java
{studentId, exerciseId, submittedAnswer: Map<String, Object>}
```

**ExerciseAttemptDto:**
```java
{id, studentId, exerciseId, attemptNumber, submittedAt, submittedAnswer, isCorrect, score, feedbackText}
```

**StudentLessonProgressDto:**
```java
{id, studentId, lessonId, status, completionPct, xpAwarded, startedAt, lastAccessedAt, completedAt}
```

**StudentReplicaDto:**
```java
{studentId, xpTotal, level}
```

## Configurare

```properties
server.port=8083
spring.datasource.url=jdbc:postgresql://localhost:5432/progress_database
content-service.url=${CONTENT_SERVICE_URL:http://localhost:8081}
user-service.url=${USER_SERVICE_URL:http://localhost:8082}
spring.jpa.hibernate.ddl-auto=update
```

## Key Architectural Decisions

**1. Minimal Student Replica**
- students_replica: DOAR student_id, xp_total, level
- Identity data (full_name, email, nickname) in User Service
- Frontend joins data from both services for display

**2. Lazy Creation**
- Replica created at FIRST attempt, NOT at registration
- No RabbitMQ infrastructure needed
- On-demand validation with User Service

**3. Level Formula**
- Linear: (xpTotal / 100) + 1
- 100 XP per level = ~3-5 lectii per level (assuming 20-30 XP/lesson)

**4. Duplicate XP Prevention**
- Track xp_awarded in progress table
- Award XP ONCE per lesson, chiar daca lesson re-completed

**5. Retry-Friendly Progress**
- Count DISTINCT correct exercises (not total attempts)
- Encourages learning from mistakes

**6. JSONB for Submitted Answers**
- Flexible structure per exercise type
- No schema migration for new types

**7. Synchronous REST Integration**
- Content MUST exist for evaluation
- Strong consistency required
- User Service validation only on lazy creation

**8. Automatic Status Transitions**
- Status calculated from completion %
- Self-healing (recalculated on every attempt)

## Example Flows

**First Attempt (Lazy Creation):**
```
POST /attempts {studentId:1, exerciseId:1, ...}
-> Check: EXISTS student_id=1? NO
-> Call: GET /users/1 -> Validate
-> Create: StudentReplica(1, 0, 1)
-> Evaluate answer
-> Save attempt
-> Update lesson progress (50% IN_PROGRESS)
```

**Lesson Completion (XP Award):**
```
POST /attempts {studentId:1, exerciseId:2, ...}
-> Evaluate (correct)
-> Update progress: 100% COMPLETED
-> Check xp_awarded: NULL
-> Award XP: xpTotal += 20, level recalculated
-> Save: xpAwarded=20, completedAt=NOW
```

**Retry Mechanism:**
```
POST /attempts (WRONG) -> attemptNumber:1, score:0
-> Progress: 0% (no correct exercises)
POST /attempts (CORRECT) -> attemptNumber:2, score:100
-> Progress: updated (counts exercise as complete)
```

**Leaderboard (Frontend JOIN):**
```
GET /students/leaderboard
-> [{studentId:17, xpTotal:250, level:3}, ...]
Frontend: FOR EACH studentId -> GET /users/{id}
-> Merge: [{rank:1, name:"DragonSlayer", xp:250, level:3}, ...]
```

## Test Scenarios

**Lazy Creation:**
```
GET /students/1/exists -> false
POST /attempts {studentId:1, ...} -> Replica created
GET /students/1/exists -> true
GET /students/1 -> {xpTotal:0, level:1}
```

**Lesson Completion:**
```
Submit exercise 1 -> 33% IN_PROGRESS, xpAwarded:null
Submit exercise 2 -> 66% IN_PROGRESS, xpAwarded:null
Submit exercise 3 -> 100% COMPLETED, xpAwarded:100
GET /students/1 -> xpTotal:100, level:2 (level up!)
```

**Duplicate XP Prevention:**
```
Complete lesson 1 -> xpAwarded:100
Teacher adds exercise 4 -> Completion drops to 75%
Submit exercise 4 -> 100% COMPLETED, xpAwarded:100 (UNCHANGED)
GET /students/1 -> xpTotal:100 (no duplicate)
```

**Retry:**
```
Submit (WRONG) -> attemptNumber:1, score:0, progress:0%
Submit (CORRECT) -> attemptNumber:2, score:100, progress:updated
```

## Known Limitations

- No pagination (leaderboard limited to 10)
- No caching for Content Service calls
- No circuit breaker for service failures
- Concurrent attempts may have race conditions on attempt_number

## AI Agent Quick Reference

**Service Identity:**
- Domain: Progress Tracking & Gamification
- Database: progress_database, Port: 8083
- Tech: Java 21, Spring Boot 4, PostgreSQL 16 (JSONB)

**Responsibilities:**
- Exercise attempts (submission, evaluation, retry)
- Lesson progress (completion %, status, XP award)
- XP/level management (formula: level = xpTotal/100 + 1)
- Student replica lazy creation (minimal cache)

**Integration:**
- Calls Content Service: GET /exercises/{id}, GET /lessons/{id}
- Calls User Service: GET /users/{id} (lazy creation only)
- Pattern: Synchronous REST (no events)

**Schema:**
- students_replica: student_id PK, xp_total, level
- exercise_attempts: JSONB submitted_answer, is_correct (score >= 70)
- student_lesson_progress: status, completion_pct, xp_awarded (duplicate prevention)

**Critical Logic:**
- Lazy creation: Replica created at FIRST attempt
- Level: (xpTotal / 100) + 1
- XP award: ONCE per lesson (via xp_awarded field)
- Progress: COUNT DISTINCT correct exercises (retry-friendly)
- Evaluation: 4 types (MULTIPLE_CHOICE, TRANSLATION, FILL_BLANK, MATCHING)

**Data Ownership:**
- Owns: XP, level, attempts, lesson progress
- Does NOT own: Student identity (User Service)
- Frontend: JOINs student names from User Service