# content-service

Microserviciu responsabil pentru gestionarea continutului educationale: unitati de curs, lectii, exercitii si materiale.

- **Port:** `8081`
- **Baza de date:** PostgreSQL — `content_database`
- **Emite JWT:** Nu
- **Swagger UI:** `http://localhost:8081/swagger-ui/index.html`
- **Storage fisiere:** MinIO — `http://localhost:9000` (bucket: `lesson-materials`)

---

## Tech Stack

- Java 21, Spring Boot, Spring Data JPA
- PostgreSQL, Hibernate (`@JdbcTypeCode` pentru JSONB)
- AWS S3 SDK (integrat cu MinIO self-hosted)

---

## Schema bazei de date

```
course_units
├── id                      BIGINT PK (auto-generated)
├── title                   VARCHAR (not null)
├── description             TEXT (nullable)
├── hsk_level               INTEGER (nullable)
├── order_index             INTEGER (not null)
└── created_by_teacher_id   BIGINT (nullable)

lessons
├── id            BIGINT PK (auto-generated)
├── unit_id       BIGINT FK → course_units.id (not null, CASCADE DELETE)
├── title         VARCHAR (not null)
├── description   TEXT (nullable)
├── xp_reward     INTEGER (not null)
└── order_index   INTEGER (not null)

exercises
├── id            BIGINT PK (auto-generated)
├── lesson_id     BIGINT FK → lessons.id (not null, CASCADE DELETE)
├── type          VARCHAR (not null)
├── prompt        TEXT (not null)
├── difficulty    INTEGER (nullable, 1-5)
└── content_data  JSONB (nullable)

lesson_materials
├── id            BIGINT PK (auto-generated)
├── lesson_id     BIGINT FK → lessons.id (not null, CASCADE DELETE)
├── title         VARCHAR (not null)
├── type          VARCHAR (not null)
└── url           VARCHAR(1000) (not null)
```

**Cascade:** stergerea unui `CourseUnit` sterge in cascada toate `Lesson`, `Exercise` si `LessonMaterial` asociate.

---

## DTO-uri

### `CourseUnitDto`
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "hskLevel": 1,
  "orderIndex": 1,
  "createdByTeacherId": 1
}
```

### `CourseUnitFullDto`
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "hskLevel": 1,
  "orderIndex": 1,
  "createdByTeacherId": 1,
  "lessons": [
    {
      "id": 1,
      "unitId": 1,
      "title": "string",
      "description": "string",
      "xpReward": 100,
      "orderIndex": 1,
      "exercises": null
    }
  ]
}
```
> `exercises` este `null` in acest context. Foloseste `GET /api/content/lessons/{id}` pentru exercitii.

### `LessonDto`
```json
{
  "id": 1,
  "unitId": 1,
  "title": "string",
  "description": "string",
  "xpReward": 100,
  "orderIndex": 1,
  "exercises": []
}
```
> `exercises` este populat DOAR la `GET /api/content/lessons/{id}`. In rest este `null`.

### `ExerciseDto`
```json
{
  "id": 1,
  "lessonId": 1,
  "type": "string",
  "prompt": "string",
  "difficulty": 1,
  "contentData": {}
}
```

### `LessonMaterialDto`
```json
{
  "id": 1,
  "lessonId": 1,
  "title": "string",
  "type": "string",
  "url": "string"
}
```

### `UnitXpStatsDto`
```json
{
  "unitId": 1,
  "totalXp": 350
}
```

### `UnitLessonCountDto`
```json
{
  "unitId": 1,
  "totalLessons": 7
}
```

### `LessonExerciseTypesDto`
```json
{
  "lessonId": 1,
  "exerciseTypes": {
    "MULTIPLE_CHOICE": 3,
    "TRANSLATION": 2,
    "FILL_BLANK": 1,
    "MATCHING": 1,
    "ORDERING": 1
  }
}
```
> Util pentru piechart pe frontend.

---

## Tipuri de exercitii — contractul `contentData`

Exista exact 5 tipuri fixe. Niciun alt tip nu va fi adaugat.

### `MULTIPLE_CHOICE`
```json
{
  "contentData": {
    "options": ["Buna ziua", "Multumesc", "La revedere", "Scuze"],
    "correctIndex": 0
  }
}
```

### `TRANSLATION`
```json
{
  "contentData": {
    "acceptedAnswers": [
      "Eu sunt student.",
      "Sunt student."
    ]
  }
}
```

### `FILL_BLANK`
```json
{
  "contentData": {
    "correctAnswers": ["是", "来自"]
  }
}
```
> Cheia este `correctAnswers` (nu `answers`).

### `MATCHING`
```json
{
  "contentData": {
    "pairs": [
      { "left": "水", "right": "apa" },
      { "left": "火", "right": "foc" }
    ]
  }
}
```
> Structura este array de `{left, right}` (nu un Map plat).

### `ORDERING`
```json
{
  "contentData": {
    "words": ["雨", "下", "天", "会", "今"],
    "correctOrder": ["今", "天", "会", "下", "雨"],
    "translation": "Astazi va ploua."
  }
}
```

---

## Contractul `submittedAnswer` per tip (pentru progress-service)

| `type` | `submittedAnswer` |
|---|---|
| `MULTIPLE_CHOICE` | `{ "selectedIndex": 0 }` |
| `TRANSLATION` | `{ "translation": "string" }` |
| `FILL_BLANK` | `{ "answers": ["raspuns1", "raspuns2"] }` |
| `MATCHING` | `{ "matches": { "水": "apa", "火": "foc" } }` |
| `ORDERING` | `{ "order": ["今", "天", "会", "下", "雨"] }` |

---

## Endpoint-uri

### Course Units

| Method | Path | Body / Params | Response |
|---|---|---|---|
| GET | /api/content/units | `?hskLevel=` (optional) | 200 `List<CourseUnitDto>` |
| GET | /api/content/units/{id} | — | 200 `CourseUnitDto` / 404 |
| GET | /api/content/units/{id}/full | — | 200 `CourseUnitFullDto` / 404 |
| GET | /api/content/units/teacher/{teacherId} | — | 200 `List<CourseUnitDto>` |
| GET | /api/content/units/{id}/stats/xp | — | 200 `UnitXpStatsDto` / 404 |
| GET | /api/content/units/{id}/stats/lessons | — | 200 `UnitLessonCountDto` / 404 |
| POST | /api/content/units | `CourseUnitDto` + Header `X-User-Id` | 201 `CourseUnitDto` / 400 |
| PUT | /api/content/units/{id} | `CourseUnitDto` | 200 `CourseUnitDto` / 400 / 404 |
| DELETE | /api/content/units/{id} | — | 204 / 404 |

**Campuri obligatorii POST/PUT:** `title`, `orderIndex`
**`createdByTeacherId`** este setat automat din header-ul `X-User-Id` injectat de API Gateway — nu se trimite in request body.

---

### Lessons

| Method | Path | Body / Params | Response |
|---|---|---|---|
| GET | /api/content/units/{unitId}/lessons | — | 200 `List<LessonDto>` (fara exercises) |
| GET | /api/content/lessons/{id} | — | 200 `LessonDto` (cu exercises) / 404 |
| GET | /api/content/lessons/{id}/stats/exercise-types | — | 200 `LessonExerciseTypesDto` / 404 |
| POST | /api/content/lessons | `LessonDto` | 201 `LessonDto` / 400 / 404 |
| PUT | /api/content/lessons/{id} | `LessonDto` | 200 `LessonDto` / 400 / 404 |
| DELETE | /api/content/lessons/{id} | — | 204 / 404 |

**Campuri obligatorii POST:** `unitId`, `title`, `orderIndex`
**Campuri obligatorii PUT:** `title`

---

### Exercises

| Method | Path | Body / Params | Response |
|---|---|---|---|
| GET | /api/content/lessons/{lessonId}/exercises | — | 200 `List<ExerciseDto>` |
| GET | /api/content/exercises/{id} | — | 200 `ExerciseDto` / 404 |
| POST | /api/content/exercises | `ExerciseDto` | 201 `ExerciseDto` / 400 / 404 |
| PUT | /api/content/exercises/{id} | `ExerciseDto` | 200 `ExerciseDto` / 400 / 404 |
| DELETE | /api/content/exercises/{id} | — | 204 / 404 |

**Campuri obligatorii POST:** `lessonId`, `type`, `prompt`
**Campuri obligatorii PUT:** `type`, `prompt` (`lessonId` nu se poate modifica)

---

### Materials

| Method | Path | Body / Params | Response |
|---|---|---|---|
| GET | /api/content/lessons/{lessonId}/materials | — | 200 `List<LessonMaterialDto>` |
| POST | /api/content/materials | `LessonMaterialDto` | 201 `LessonMaterialDto` / 400 / 404 |
| POST | /api/content/materials/upload | `MultipartFile` (form-data, key: `file`) | 201 URL string / 400 / 500 |
| DELETE | /api/content/materials/{id} | — | 204 / 404 |

**Campuri obligatorii POST /materials:** `lessonId`, `title`, `url`
**Tipuri de fisiere permise la upload:** `image/jpeg`, `image/png`, `image/gif`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `audio/mpeg`, `audio/wav`, `video/mp4`

**Flux upload fisier:**
1. `POST /api/content/materials/upload` cu fisierul → primesti URL MinIO
2. `POST /api/content/materials` cu URL-ul primit → salveaza materialul in DB

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| GET | /api/content/units | | ✓ | ✓ | ✓ |
| GET | /api/content/units/{id} | | ✓ | ✓ | ✓ |
| GET | /api/content/units/{id}/full | | ✓ | ✓ | ✓ |
| GET | /api/content/units/teacher/{teacherId} | | | own | ✓ |
| GET | /api/content/units/{id}/stats/xp | | ✓ | ✓ | ✓ |
| GET | /api/content/units/{id}/stats/lessons | | ✓ | ✓ | ✓ |
| POST | /api/content/units | | | ✓ | ✓ |
| PUT | /api/content/units/{id} | | | ✓ | ✓ |
| DELETE | /api/content/units/{id} | | | | ✓ |
| GET | /api/content/units/{unitId}/lessons | | ✓ | ✓ | ✓ |
| GET | /api/content/lessons/{id} | | ✓ | ✓ | ✓ |
| GET | /api/content/lessons/{id}/stats/exercise-types | | ✓ | ✓ | ✓ |
| POST | /api/content/lessons | | | ✓ | ✓ |
| PUT | /api/content/lessons/{id} | | | ✓ | ✓ |
| DELETE | /api/content/lessons/{id} | | | | ✓ |
| GET | /api/content/lessons/{lessonId}/exercises | | ✓ | ✓ | ✓ |
| GET | /api/content/exercises/{id} | | ✓ | ✓ | ✓ |
| POST | /api/content/exercises | | | ✓ | ✓ |
| PUT | /api/content/exercises/{id} | | | ✓ | ✓ |
| DELETE | /api/content/exercises/{id} | | | | ✓ |
| GET | /api/content/lessons/{lessonId}/materials | | ✓ | ✓ | ✓ |
| POST | /api/content/materials | | | ✓ | ✓ |
| POST | /api/content/materials/upload | | | ✓ | ✓ |
| DELETE | /api/content/materials/{id} | | | | ✓ |

> **own** = API Gateway verifica ca `teacherId` din path coincide cu `userId` din JWT claims.
> Niciun endpoint nu necesita verificarea `userId` din JWT claims in afara de `GET /api/content/units/teacher/{teacherId}`.
> `POST /api/content/units` primeste `X-User-Id` din header (injectat de Gateway) pentru a seta `createdByTeacherId`.

---

## Headers injectate de API Gateway

| Header | Tip | Folosit de |
|---|---|---|
| `X-User-Id` | `Long` | `POST /api/content/units` — seteaza `createdByTeacherId` |

---

## Structura pachetelor

```
contentservice/
├── domain/
│   ├── CourseUnit.java
│   ├── Lesson.java
│   ├── Exercise.java
│   ├── LessonMaterial.java
│   ├── dao/
│   │   ├── ICourseUnitDao.java
│   │   ├── ILessonDao.java
│   │   ├── IExerciseDao.java
│   │   └── ILessonMaterialDao.java
│   └── dto/
│       ├── CourseUnitDto.java
│       ├── CourseUnitFullDto.java
│       ├── LessonDto.java
│       ├── ExerciseDto.java
│       ├── LessonMaterialDto.java
│       ├── UnitXpStatsDto.java
│       ├── UnitLessonCountDto.java
│       └── LessonExerciseTypesDto.java
├── repository/
│   ├── entities/
│   │   ├── CourseUnitEntity.java
│   │   ├── LessonEntity.java
│   │   ├── ExerciseEntity.java
│   │   └── LessonMaterialEntity.java
│   ├── jpa/
│   │   ├── CourseUnitJpaRepository.java
│   │   ├── LessonJpaRepository.java
│   │   ├── ExerciseJpaRepository.java
│   │   └── LessonMaterialJpaRepository.java
│   ├── CourseUnitDao.java
│   ├── LessonDao.java
│   ├── ExerciseDao.java
│   └── LessonMaterialDao.java
├── service/
│   ├── ContentService.java
│   └── StorageService.java
├── controller/
│   └── ContentController.java
└── config/
    └── MinioConfig.java
```