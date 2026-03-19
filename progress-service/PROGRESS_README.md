# progress-service

Microserviciu responsabil pentru gestionarea tentativelor la exercitii, progresul lectiilor si XP-ul studentilor.

- **Port:** `8083`
- **Baza de date:** PostgreSQL — `progress_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8083/swagger-ui/index.html`

---

## Tech Stack

- Java 21, Spring Boot, Spring Data JPA
- PostgreSQL, Hibernate (JSONB support via `@JdbcTypeCode`)
- RestTemplate (comunicare sincrona cu `content-service`)

---

## Dependente inter-servicii

| Serviciu | Endpoint apelat | Scop |
|---|---|---|
| `content-service` (8081) | `GET /api/content/exercises/{id}` | Obtine tipul si datele exercitiului pentru evaluare |
| `content-service` (8081) | `GET /api/content/lessons/{id}` | Obtine lista exercitiilor si XP reward-ul lectiei |
| `content-service` (8081) | `GET /api/content/units/{unitId}/lessons` | Obtine lista lectiilor dintr-o unitate pentru calculul progresului per unitate |

`user-service` nu este apelat direct. `studentId` este preluat exclusiv din header-ul `X-User-Id` injectat de API Gateway.

---

## Schema bazei de date

```
students_replica
├── student_id    BIGINT PK (provine din user-service, nu auto-generat)
├── xp_total      INTEGER (not null, default 0)
└── level         INTEGER (not null, default 1)

student_lesson_progress
├── id                BIGINT PK (auto-generated)
├── student_id        BIGINT (not null)
├── lesson_id         BIGINT (not null)
├── status            VARCHAR(20) (not null) — NOT_STARTED | IN_PROGRESS | COMPLETED
├── completion_pct    DECIMAL(5,2) (not null, default 0)
├── xp_awarded        INTEGER (nullable — null pana la completare)
├── started_at        TIMESTAMP (nullable)
├── last_accessed_at  TIMESTAMP (nullable)
└── completed_at      TIMESTAMP (nullable — null pana la completare)
UNIQUE CONSTRAINT: (student_id, lesson_id)

exercise_attempts
├── id                BIGINT PK (auto-generated)
├── student_id        BIGINT (not null)
├── exercise_id       BIGINT (not null)
├── attempt_number    INTEGER (not null)
├── submitted_at      TIMESTAMP (not null)
├── submitted_answer  JSONB (not null)
├── is_correct        BOOLEAN (not null)
├── score             DECIMAL(5,2) (not null)
└── feedback_text     TEXT (nullable)
```

**Logica de nivel:** `level = (xpTotal / 100) + 1`
**Logica de corectitudine:** o tentativa este corecta daca `score >= 70`

---

## Modele de date (DTO-uri)

### `StudentReplicaDto`
```json
{
  "studentId": 1,
  "xpTotal": 250,
  "level": 3
}
```

### `StudentSummaryDto`
```json
{
  "studentId": 1,
  "xpTotal": 250,
  "level": 3,
  "completedLessonsCount": 5,
  "inProgressLessonsCount": 2
}
```

### `StudentUnitProgressDto`
```json
{
  "unitId": 1,
  "studentId": 1,
  "totalLessons": 5,
  "completedLessons": 3,
  "inProgressLessons": 1,
  "notStartedLessons": 1,
  "unitCompletionPct": 60.00
}
```
> `unitCompletionPct` este calculat exclusiv pe baza lectiilor cu status `COMPLETED` din totalul lectiilor unitatii.

### `StudentLessonProgressDto`
```json
{
  "id": 1,
  "studentId": 1,
  "lessonId": 1,
  "status": "IN_PROGRESS",
  "completionPct": 66.67,
  "xpAwarded": null,
  "startedAt": "2024-01-01T10:00:00",
  "lastAccessedAt": "2024-01-01T10:05:00",
  "completedAt": null
}
```
> `xpAwarded` si `completedAt` sunt `null` pana cand `status` devine `COMPLETED`.

### `ExerciseAttemptDto`
```json
{
  "id": 1,
  "studentId": 1,
  "exerciseId": 1,
  "attemptNumber": 1,
  "submittedAt": "2024-01-01T10:00:00",
  "submittedAnswer": {},
  "isCorrect": true,
  "score": 100.00,
  "feedbackText": "Corect!"
}
```

### `SubmitAttemptRequest` (request body)
```json
{
  "exerciseId": 1,
  "submittedAnswer": {}
}
```
> `studentId` este absent din request body — este extras din header-ul `X-User-Id`.

---

## Structura `submittedAnswer` per tip de exercitiu

| Tip exercitiu | Structura `submittedAnswer` |
|---|---|
| `MULTIPLE_CHOICE` | `{ "selectedIndex": 2 }` |
| `TRANSLATION` | `{ "translation": "string" }` |
| `FILL_BLANK` | `{ "answers": ["raspuns1", "raspuns2"] }` |
| `MATCHING` | `{ "matches": { "stanga1": "dreapta1", "stanga2": "dreapta2" } }` |

---

## Endpoint-uri

### Progress & Tentative — `/api/progress`

#### `POST /api/progress/attempts`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Request body:** `SubmitAttemptRequest`
- **Comportament:** evalueaza raspunsul, salveaza tentativa, actualizeaza progresul lectiei, acorda XP la completare. Creeaza automat replica studentului la prima tentativa.
- **Response `201`:** `ExerciseAttemptDto`
- **Response `400`:** exercitiu inexistent sau date invalide
- **Response `503`:** `content-service` indisponibil

---

#### `GET /api/progress/attempts/student/{studentId}/exercise/{exerciseId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `ExerciseAttemptDto` ordonata dupa `attemptNumber` ascending
- **Response `403`:** STUDENT incearca sa acceseze datele altui student
- **Response `404`:** nu exista tentative

---

#### `GET /api/progress/lessons/student/{studentId}/lesson/{lessonId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `StudentLessonProgressDto`
- **Response `403`:** STUDENT incearca sa acceseze datele altui student
- **Response `404`:** nu exista progres inregistrat

---

#### `GET /api/progress/lessons/student/{studentId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `StudentLessonProgressDto` pentru toate lectiile incepute

---

#### `GET /api/progress/lessons/student/{studentId}/in-progress`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `StudentLessonProgressDto` cu `status = IN_PROGRESS`

---

#### `GET /api/progress/lessons/{lessonId}/leaderboard`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** lista de maxim 10 `StudentLessonProgressDto` ordonata dupa `completionPct` descrescator

---

#### `GET /api/progress/students/{studentId}/summary`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `StudentSummaryDto` — XP, nivel, numar lectii completate si in progres intr-un singur apel
- **Response `403`:** STUDENT incearca sa acceseze datele altui student

---

#### `GET /api/progress/units/{unitId}/student/{studentId}/progress`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `StudentUnitProgressDto` — numar lectii completate, in progres, neincepute si procentul de completare al unitatii
- **Response `400`:** unitatea nu exista in `content-service`
- **Response `403`:** STUDENT incearca sa acceseze datele altui student
- **Response `503`:** `content-service` indisponibil

---

### Student XP & Nivel — `/api/progress/students`

#### `GET /api/progress/students/leaderboard`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** lista de maxim 10 `StudentReplicaDto` ordonata dupa `xpTotal` descrescator

---

#### `GET /api/progress/students/{studentId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `StudentReplicaDto`
- **Response `403`:** STUDENT incearca sa acceseze datele altui student
- **Response `404`:** studentul nu a trimis nicio tentativa inca

---

#### `GET /api/progress/students/{studentId}/exists`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `true` / `false`
- **Response `403`:** STUDENT incearca sa acceseze datele altui student

---

#### `GET /api/progress/students/admin/all`
- **Autorizare:** ADMIN only
- **Headers obligatorii:** `X-User-Role`
- **Response `200`:** lista completa de `StudentReplicaDto` ordonata dupa `xpTotal` descrescator
- **Response `403`:** rol non-ADMIN

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/progress/attempts | | own | | ✓ |
| GET | /api/progress/attempts/student/{studentId}/exercise/{exerciseId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId}/lesson/{lessonId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId}/in-progress | | own | | ✓ |
| GET | /api/progress/lessons/{lessonId}/leaderboard | | ✓ | ✓ | ✓ |
| GET | /api/progress/students/{studentId}/summary | | own | | ✓ |
| GET | /api/progress/units/{unitId}/student/{studentId}/progress | | own | | ✓ |
| GET | /api/progress/students/leaderboard | | ✓ | ✓ | ✓ |
| GET | /api/progress/students/{studentId} | | own | | ✓ |
| GET | /api/progress/students/{studentId}/exists | | own | | ✓ |
| GET | /api/progress/students/admin/all | | | | ✓ |

> **own** = API Gateway verifica daca `userId` din path coincide cu `userId` din JWT claims.
> Toate endpoint-urile marcate cu `own` sau `✓` necesita headerele `X-User-Id` si `X-User-Role` injectate de API Gateway.

---

## Headers injectate de API Gateway

| Header | Tip | Descriere |
|---|---|---|
| `X-User-Id` | `Long` | `userId` din JWT claims |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Structura pachetelor

```
progressservice/
├── domain/
│   ├── ExerciseAttempt.java
│   ├── StudentLessonProgress.java
│   ├── StudentReplica.java
│   ├── ports/
│   │   └── IContentServicePort.java
│   ├── dao/
│   │   ├── IExerciseAttemptDao.java
│   │   ├── IStudentLessonProgressDao.java
│   │   └── IStudentReplicaDao.java
│   └── dto/
│       ├── EvaluationResultDto.java
│       ├── ExerciseAttemptDto.java
│       ├── ExerciseResponseDto.java
│       ├── LessonResponseDto.java
│       ├── StudentLessonProgressDto.java
│       ├── StudentReplicaDto.java
│       ├── StudentSummaryDto.java
│       ├── StudentUnitProgressDto.java
│       └── SubmitAttemptRequest.java
├── repository/
│   ├── entities/
│   │   ├── ExerciseAttemptEntity.java
│   │   ├── StudentLessonProgressEntity.java
│   │   └── StudentReplicaEntity.java
│   ├── jpa/
│   │   ├── ExerciseAttemptJpaRepository.java
│   │   ├── StudentLessonProgressJpaRepository.java
│   │   └── StudentReplicaJpaRepository.java
│   ├── ExerciseAttemptDao.java
│   ├── StudentLessonProgressDao.java
│   └── StudentReplicaDao.java
├── service/
│   ├── EvaluationService.java
│   ├── ProgressService.java
│   └── StudentReplicaService.java
├── controller/
│   ├── ProgressController.java
│   └── StudentReplicaController.java
├── clients/
│   └── ContentServiceClient.java
└── config/
    └── AppConfig.java
```