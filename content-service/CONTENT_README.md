# content-service

Microserviciu responsabil pentru gestionarea conținutului educațional al platformei de învățare a limbii chineze: unități de curs, lecții, materiale și exerciții.

- **Port:** `8081`
- **Bază de date:** PostgreSQL — `content_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8081/swagger-ui/index.html`

---

## Tech Stack

- Java 21, Spring Boot, Spring Data JPA
- PostgreSQL, Hibernate (JSONB support via `@JdbcTypeCode`)

---

## Schema bazei de date

```
course_units
├── id            BIGINT PK (auto-generated)
├── title         VARCHAR (not null)
├── description   TEXT (nullable)
├── hsk_level     INTEGER (nullable)
└── order_index   INTEGER (not null)

lessons
├── id            BIGINT PK (auto-generated)
├── unit_id       BIGINT FK → course_units.id (not null)
├── title         VARCHAR (not null)
├── description   TEXT (nullable)
├── xp_reward     INTEGER (not null)
└── order_index   INTEGER (not null)

exercises
├── id            BIGINT PK (auto-generated)
├── lesson_id     BIGINT FK → lessons.id (not null)
├── type          VARCHAR (not null)
├── prompt        TEXT (not null)
├── difficulty    INTEGER (nullable)
└── content_data  JSONB (nullable)

lesson_materials
├── id            BIGINT PK (auto-generated)
├── lesson_id     BIGINT FK → lessons.id (not null)
├── title         VARCHAR (not null)
├── type          VARCHAR (not null)
└── url           VARCHAR(1000) (not null)
```

**Relații:**
- Un `CourseUnit` conține mai multe `Lesson` (CASCADE DELETE)
- O `Lesson` conține mai multe `Exercise` și `LessonMaterial` (CASCADE DELETE)
- Ștergerea unui `CourseUnit` șterge în cascadă toate `Lesson`, `Exercise` și `LessonMaterial` asociate

---

## Modele de date (DTO-uri)

### `CourseUnitDto`
```json
{
  "id": 1,
  "title": "string",
  "description": "string",
  "hskLevel": 1,
  "orderIndex": 1
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
> `exercises` din interiorul fiecărui `LessonDto` este `null` în acest response. Pentru exercițiile unei lecții, folosește `GET /api/content/lessons/{id}`.

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
> Câmpul `exercises` este populat **doar** la `GET /api/content/lessons/{id}`. În toate celelalte contexte, `exercises` este `null`.

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
> `contentData` este un obiect JSON liber, structura variază în funcție de `type`.

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

---

## Endpoint-uri

### Course Units — `/api/content/units`

#### `GET /api/content/units`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Query params:** `hskLevel` (optional, Integer) — filtrează după nivel HSK
- **Exemple:**
    - `GET /api/content/units` — returnează toate unitățile
    - `GET /api/content/units?hskLevel=2` — returnează doar unitățile de nivel HSK 2
- **Response `200`:** listă de `CourseUnitDto` ordonată după `orderIndex`

---

#### `GET /api/content/units/{id}`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** `CourseUnitDto`
- **Response `404`:** unitatea nu există

---

#### `GET /api/content/units/{id}/full`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** `CourseUnitFullDto` — unitatea cu lista de lecții inclusă
- **Response `404`:** unitatea nu există
> Util pentru ecranele de tip "detaliu unitate" care au nevoie de unitate + lecții într-un singur call.

---

#### `POST /api/content/units`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `title`, `orderIndex`
- **Request body:**
```json
{
  "title": "string",
  "description": "string",
  "hskLevel": 1,
  "orderIndex": 1
}
```
- **Response `201`:** `CourseUnitDto`
- **Response `400`:** `title` sau `orderIndex` lipsă

---

#### `PUT /api/content/units/{id}`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `title`
- **Request body:** identic cu POST
- **Response `200`:** `CourseUnitDto` actualizat
- **Response `400`:** `title` lipsă
- **Response `404`:** unitatea nu există

---

#### `DELETE /api/content/units/{id}`
- **Autorizare:** ADMIN only
- **Response `204`:** șters cu succes (cascade: lecții, exerciții, materiale)
- **Response `404`:** unitatea nu există

---

### Lessons — `/api/content/lessons`

#### `GET /api/content/units/{unitId}/lessons`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** listă de `LessonDto` ordonată după `orderIndex` (fără `exercises`)

---

#### `GET /api/content/lessons/{id}`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** `LessonDto` cu `exercises` populat
- **Response `404`:** lecția nu există

---

#### `POST /api/content/lessons`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `unitId`, `title`, `orderIndex`
- **Request body:**
```json
{
  "unitId": 1,
  "title": "string",
  "description": "string",
  "xpReward": 100,
  "orderIndex": 1
}
```
- **Response `201`:** `LessonDto`
- **Response `400`:** câmpuri obligatorii lipsă
- **Response `404`:** `unitId` nu există

---

#### `PUT /api/content/lessons/{id}`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `title`
- **Request body:** identic cu POST
- **Response `200`:** `LessonDto` actualizat
- **Response `400`:** `title` lipsă
- **Response `404`:** lecția sau unitatea nu există

---

#### `DELETE /api/content/lessons/{id}`
- **Autorizare:** ADMIN only
- **Response `204`:** șters cu succes (cascade: exerciții, materiale)
- **Response `404`:** lecția nu există

---

### Exercises — `/api/content/exercises`

#### `GET /api/content/lessons/{lessonId}/exercises`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** listă de `ExerciseDto`

---

#### `GET /api/content/exercises/{id}`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** `ExerciseDto`
- **Response `404`:** exercițiul nu există

---

#### `POST /api/content/exercises`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `lessonId`, `type`, `prompt`
- **Request body:**
```json
{
  "lessonId": 1,
  "type": "string",
  "prompt": "string",
  "difficulty": 1,
  "contentData": {}
}
```
- **Response `201`:** `ExerciseDto`
- **Response `400`:** câmpuri obligatorii lipsă
- **Response `404`:** `lessonId` nu există

---

#### `PUT /api/content/exercises/{id}`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `type`, `prompt`
- **Request body:** identic cu POST (fără `lessonId` — nu se poate schimba lecția)
- **Response `200`:** `ExerciseDto` actualizat
- **Response `400`:** câmpuri obligatorii lipsă
- **Response `404`:** exercițiul nu există

---

#### `DELETE /api/content/exercises/{id}`
- **Autorizare:** ADMIN only
- **Response `204`:** șters cu succes
- **Response `404`:** exercițiul nu există

---

### Materials — `/api/content/materials`

#### `GET /api/content/lessons/{lessonId}/materials`
- **Autorizare:** STUDENT, TEACHER, ADMIN
- **Response `200`:** listă de `LessonMaterialDto`

---

#### `POST /api/content/materials`
- **Autorizare:** ADMIN only
- **Câmpuri obligatorii:** `lessonId`, `title`, `url`
- **Request body:**
```json
{
  "lessonId": 1,
  "title": "string",
  "type": "string",
  "url": "string"
}
```
- **Response `201`:** `LessonMaterialDto`
- **Response `400`:** câmpuri obligatorii lipsă
- **Response `404`:** `lessonId` nu există

---

#### `DELETE /api/content/materials/{id}`
- **Autorizare:** ADMIN only
- **Response `204`:** șters cu succes
- **Response `404`:** materialul nu există

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path                                        | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|---------------------------------------------|--------|---------|---------|-------|
| GET    | /api/content/units                          |        | ✓       | ✓       | ✓     |
| GET    | /api/content/units/{id}                     |        | ✓       | ✓       | ✓     |
| GET    | /api/content/units/{id}/full                |        | ✓       | ✓       | ✓     |
| POST   | /api/content/units                          |        |         |         | ✓     |
| PUT    | /api/content/units/{id}                     |        |         |         | ✓     |
| DELETE | /api/content/units/{id}                     |        |         |         | ✓     |
| GET    | /api/content/units/{unitId}/lessons         |        | ✓       | ✓       | ✓     |
| GET    | /api/content/lessons/{id}                   |        | ✓       | ✓       | ✓     |
| POST   | /api/content/lessons                        |        |         |         | ✓     |
| PUT    | /api/content/lessons/{id}                   |        |         |         | ✓     |
| DELETE | /api/content/lessons/{id}                   |        |         |         | ✓     |
| GET    | /api/content/lessons/{lessonId}/exercises   |        | ✓       | ✓       | ✓     |
| GET    | /api/content/exercises/{id}                 |        | ✓       | ✓       | ✓     |
| POST   | /api/content/exercises                      |        |         |         | ✓     |
| PUT    | /api/content/exercises/{id}                 |        |         |         | ✓     |
| DELETE | /api/content/exercises/{id}                 |        |         |         | ✓     |
| GET    | /api/content/lessons/{lessonId}/materials   |        | ✓       | ✓       | ✓     |
| POST   | /api/content/materials                      |        |         |         | ✓     |
| DELETE | /api/content/materials/{id}                 |        |         |         | ✓     |

> Niciun endpoint nu necesită verificarea `userId` din JWT claims — autorizarea este exclusiv pe bază de rol.

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
│       └── LessonMaterialDto.java
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
│   └── ContentService.java
└── controller/
    └── ContentController.java
```