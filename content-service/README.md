# Content Service - Chinese Learning Platform

Microserviciu pentru gestionarea continutului educational: unitati de curs, lectii, materiale si exercitii cu suport JSONB.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA + JSONB native support)
* **Maven** + **SpringDoc OpenAPI**

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + manual DTO mapping
controller/   -> REST endpoints + Swagger docs
```

**Reguli Implementare (AI Context):**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod
- Hibernate ddl-auto=update (schema auto-generata din entities)
- JSONB pentru flexibilitate exercitii (Hibernate 6 @JdbcTypeCode)

## Schema Baza de Date

**Database:** `content_database` (postgres/kuso)  
**Port:** 8081  
**Swagger:** http://localhost:8081/swagger-ui/index.html

### Relatii si Cascade Strategy:
```
course_units (PK: id, auto-inc)
├── id, title, description, hsk_level, order_index
└── 1:N -> lessons (CascadeType.ALL, orphanRemoval=true)

lessons (PK: id, auto-inc)
├── id, unit_id (FK), title, description, xp_reward, order_index
├── 1:N -> exercises (CascadeType.ALL, orphanRemoval=true)
└── 1:N -> lesson_materials (CascadeType.ALL, orphanRemoval=true)

exercises (PK: id, auto-inc)
├── id, lesson_id (FK), type, prompt, difficulty
└── content_data (JSONB) - structura dinamica per tip exercitiu

lesson_materials (PK: id, auto-inc)
└── id, lesson_id (FK), title, type (VIDEO/PDF/LINK), url
```

**Cascade Logic:**
- Delete CourseUnit → sterge automat toate Lessons asociate
- Delete Lesson → sterge automat toate Exercises si Materials
- `orphanRemoval=true` → daca scoți un element din lista, se sterge din DB

**Fetch Strategy:** LAZY pe toate relatiile @ManyToOne/@OneToMany (optimizare N+1 queries)

## JSONB Strategy - Exercitii Flexibile

### De ce JSONB?
Permite tipuri diverse de exercitii fara schema rigida:
- MULTIPLE_CHOICE, TRANSLATION, MATCHING, FILL_BLANK, etc.
- Adaugare tipuri noi fara migrari DB
- Query-uri PostgreSQL native pe JSON (WHERE content_data->>'type' = 'X')

### Mapping Hibernate 6:
```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "content_data", columnDefinition = "jsonb")
private Map<String, Object> contentData;
```


**Jackson** (inclus in Spring Boot) serializeaza/deserializeaza automat Map <-> JSON.


### Exemple Structuri JSONB:

#### TRANSLATION:
```json
{
  "lessonId": 1,
  "type": "TRANSLATION",
  "prompt": "Traduce urmatoarea fraza in chineza",
  "difficulty": 2,
  "contentData": {
    "sourceText": "I am a student",
    "targetLanguage": "zh",
    "correctTranslation": "我是学生",
    "alternativeTranslations": ["我是一个学生"]
  }
}
```

#### MATCHING:
```json
{
  "lessonId": 2,
  "type": "MATCHING",
  "prompt": "Asociaza cuvintele chineze cu traducerile lor",
  "difficulty": 2,
  "contentData": {
    "pairs": [
      {"left": "你好", "right": "Hello"},
      {"left": "谢谢", "right": "Thank you"},
      {"left": "再见", "right": "Goodbye"}
    ]
  }
}
```

## Entities si DTOs

### Entities (JPA):

**CourseUnit:**
```java
@OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Lesson> lessons = new ArrayList<>();
```

**Lesson:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "unit_id", nullable = false)
private CourseUnit unit;

@OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
private List<Exercise> exercises;

@OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
private List<LessonMaterial> materials;
```

**Exercise:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "lesson_id", nullable = false)
private Lesson lesson;

@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "content_data", columnDefinition = "jsonb")
private Map<String, Object> contentData;
```

**LessonMaterial:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "lesson_id", nullable = false)
private Lesson lesson;

// Fields: title, type (VIDEO/PDF/LINK), url (max 1000 chars)
```

### DTOs (Transfer Objects):

Toate DTO-urile sunt simple POJOs fara nested objects:
- `CourseUnitDto`: id, title, description, hskLevel, orderIndex
- `LessonDto`: id, unitId, title, description, xpReward, orderIndex
- `ExerciseDto`: id, lessonId, type, prompt, difficulty, contentData (Map)
- `LessonMaterialDto`: id, lessonId, title, type, url

**Mapare manuala in Service layer:**
```java
private LessonDto mapLessonToDto(Lesson lesson) {
    return new LessonDto(
        lesson.getId(),
        lesson.getUnit().getId(),  // Extrage doar FK, nu intreg obiectul
        lesson.getTitle(),
        lesson.getDescription(),
        lesson.getXpReward(),
        lesson.getOrderIndex()
    );
}
```

## API Endpoints

Toate rutele incep cu `/api/content`.

### 1. Course Units
```
GET    /units           -> Lista toate unitatile (ordonat dupa orderIndex)
GET    /units/{id}      -> Detalii unitate
POST   /units           -> Creare unitate
PUT    /units/{id}      -> Update unitate
DELETE /units/{id}      -> Stergere (cascade -> sterge si lectiile)
```

### 2. Lessons
```
GET    /units/{unitId}/lessons  -> Lectiile unei unitati
GET    /lessons/{id}            -> Detalii lectie
POST   /lessons                 -> Creare lectie
PUT    /lessons/{id}            -> Update (permite schimbare unit)
DELETE /lessons/{id}            -> Stergere
```

### 3. Materials
```
GET    /lessons/{lessonId}/materials  -> Materialele unei lectii
POST   /materials                     -> Adauga material
DELETE /materials/{id}                -> Stergere material
```

### 4. Exercises
```
GET    /lessons/{lessonId}/exercises  -> Exercitiile unei lectii
POST   /exercises                     -> Creare exercitiu (JSONB arbitrar)
PUT    /exercises/{id}                -> Update (inclusiv contentData)
DELETE /exercises/{id}                -> Stergere
```

## Service Layer Logic

**ContentService** (@Transactional pe clasa):
- **CRUD CourseUnits:** getAllCourseUnits (ordonat), getCourseUnit, create, update, delete
- **CRUD Lessons:** getLessonsByUnitId, getLesson, create, update (permite move to other unit), delete
- **Materials:** getMaterialsForLesson, addLessonMaterial, deleteLessonMaterial
- **Exercises:** getExercisesForLesson, addExercise, updateExercise, deleteExercise

**Mapare manuala Entity → DTO:**
```java
private ExerciseDto mapExerciseToDto(Exercise exercise) {
    return new ExerciseDto(
        exercise.getId(),
        exercise.getLesson().getId(),
        exercise.getType(),
        exercise.getPrompt(),
        exercise.getDifficulty(),
        exercise.getContentData()  // Map<String,Object> transmis direct
    );
}
```

**Validari:**
- Throw `RuntimeException` pentru entitati not found
- No @ControllerAdvice (simplificare licenta)
- Controller prinde exceptia → returneaza 500 (poate fi imbunatatit cu custom exceptions)

## Repository Custom Queries

**ICourseUnitDao:**
```java
List<CourseUnit> findAllByOrderByOrderIndexAsc();
```

**ILessonDao:**
```java
List<Lesson> findByUnitIdOrderByOrderIndexAsc(Long unitId);
```

**IExerciseDao, ILessonMaterialDao:**
```java
List<Exercise> findByLessonId(Long lessonId);
List<LessonMaterial> findByLessonId(Long lessonId);
```

## Configurare

**application.properties:**
```properties
server.port=8081
spring.datasource.url=jdbc:postgresql://localhost:5432/content_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

**Setup DB:**
```sql
CREATE DATABASE content_database;
```

**Rulare:**
```bash
mvn spring-boot:run
```

## Integrare Cross-Service

**Foreign Keys Logice** (Database per Service pattern):

- **Progress Service:** `exercise_attempts.exercise_id` → exercises.id
- **Progress Service:** `student_lesson_progress.lesson_id` → lessons.id
- **User Service:** `lessons.xp_reward` folosit pentru calculare XP student

**Flow complet:**
1. Student acceseaza Lesson (GET /lessons/{id})
2. Student rezolva Exercise (POST la Progress Service cu exercise_id)
3. Progress Service verifica raspunsul comparat cu contentData.correctAnswer
4. Daca corect, Progress Service apeleaza User Service: PUT /students/{userId}/xp?xpToAdd={lesson.xpReward}

## Decizii Arhitecturale (AI Context)

**JSONB pentru Exercises:**
- Flexibilitate maxima: noi tipuri de exercitii fara schema migrations
- PostgreSQL native indexing pe JSON: `CREATE INDEX idx_exercise_type ON exercises ((content_data->>'type'));`
- Trade-off: validare structura JSON in Application Layer (nu in DB)

**Cascade ALL + orphanRemoval:**
- Simplifica codul (delete parent → sterge automat children)
- Atentie: poate sterge multe date accidental (delete unit → sterge toate lectiile si exercitiile)
- Pentru productie: consider soft delete (deleted_at column)

**LAZY Fetch pe toate relatiile:**
- Evita N+1 queries (ex: load 10 units NU incarca automat 100 lessons)
- Datele se incarca doar la acces explicit: `lesson.getExercises()`
- Necesita sesiune Hibernate activa (@Transactional pe Service)

**Manual DTO Mapping:**
- Control complet asupra structurii DTO-urilor
- Evita lazy loading exceptions (extrage doar ID-uri pentru FK, nu obiecte intregi)
- Pattern: `lesson.getUnit().getId()` vs `lesson.getUnit()` (ar incarca tot CourseUnit)

**order_index Field:**
- Permite ordonare custom in UI (drag-and-drop reorder)
- Nu folosim AUTO_INCREMENT pentru order - teacher poate reseta ordinea
- Gap-uri permise (1, 2, 5, 10) - facilitate pentru inserari viitoare

**RuntimeException simplificat:**
- Pentru licenta: throw generic exceptions
- Productie: custom exceptions (EntityNotFoundException, ValidationException) + @ControllerAdvice

## Test Scenarios (Swagger)

1. **Create Course Structure:**
    - POST /units (HSK 1 Unit)
    - POST /lessons cu unitId (3 lectii)
    - POST /exercises cu lessonId (5 exercitii MULTIPLE_CHOICE)
    - GET /units/{id} → verifica cascade relationships

2. **JSONB Flexibility:**
    - POST exercise type MULTIPLE_CHOICE
    - POST exercise type TRANSLATION
    - GET /lessons/{id}/exercises → verifica ambele tipuri returned corect

3. **Cascade Delete:**
    - DELETE /units/{id}
    - Verifica in DB: lessons si exercises sterge automat

4. **Lesson Move:**
    - PUT /lessons/{id} cu unitId diferit
    - Verifica lesson.unit_id updated

5. **Materials Attach:**
    - POST /materials cu type VIDEO, PDF, LINK
    - GET /lessons/{id}/materials → verifica lista

---

