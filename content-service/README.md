# Content Service - Chinese Learning Platform

Microserviciu pentru gestionarea continutului educational: unitati de curs, lectii, materiale si exercitii cu suport JSONB pentru flexibilitate maxima.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA + JSONB native support)
* **Maven** + **SpringDoc OpenAPI**
* **Docker** + Amazon Corretto 21

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + manual DTO mapping
controller/   -> REST endpoints + Swagger docs
```

**Reguli Implementare (AI Context):**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod si comentarii (encoding safety)
- Comentarii DOAR cu // (INTERZIS /* ... */)
- Hibernate ddl-auto=update (schema auto-generata din entities)
- JSONB pentru flexibilitate exercitii (Hibernate 6 @JdbcTypeCode)
- Controllers NU importa DAO (separation of concerns strict)

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
- `orphanRemoval=true` → daca scoti un element din lista, se sterge din DB

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

#### MULTIPLE_CHOICE:
```json
{
  "lessonId": 1,
  "type": "MULTIPLE_CHOICE",
  "prompt": "What is 'Hello' in Chinese?",
  "difficulty": 1,
  "contentData": {
    "options": ["你好", "再见", "谢谢", "对不起"],
    "correctOption": "你好"
  }
}
```

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

#### FILL_BLANK:
```json
{
  "lessonId": 2,
  "type": "FILL_BLANK",
  "prompt": "Fill in the blanks: 我_学生，你_老师",
  "difficulty": 2,
  "contentData": {
    "sentence": "我_学生，你_老师",
    "correctAnswers": ["是", "是"]
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
@Entity
@Table(name = "course_units")
public class CourseUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String description;
    private String hskLevel;
    private Integer orderIndex;
    
    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Lesson> lessons = new ArrayList<>();
}
```

**Lesson:**
```java
@Entity
@Table(name = "lessons")
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private CourseUnit unit;
    
    private String title;
    private String description;
    private Integer xpReward;
    private Integer orderIndex;
    
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Exercise> exercises = new ArrayList<>();
    
    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonMaterial> materials = new ArrayList<>();
}
```

**Exercise:**
```java
@Entity
@Table(name = "exercises")
public class Exercise {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;
    
    private String type;
    private String prompt;
    private Integer difficulty;
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_data", columnDefinition = "jsonb")
    private Map<String, Object> contentData;
}
```

**LessonMaterial:**
```java
@Entity
@Table(name = "lesson_materials")
public class LessonMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;
    
    private String title;
    private String type; // VIDEO, PDF, LINK
    
    @Column(length = 1000)
    private String url;
}
```

### DTOs (Transfer Objects):

Toate DTO-urile sunt simple POJOs fara nested objects:
- `CourseUnitDto`: id, title, description, hskLevel, orderIndex
- `LessonDto`: id, unitId, title, description, xpReward, orderIndex, **exercises** (List<ExerciseDto>)
- `ExerciseDto`: id, lessonId, type, prompt, difficulty, contentData (Map)
- `LessonMaterialDto`: id, lessonId, title, type, url

**IMPORTANT:** `LessonDto` include lista de `exercises` pentru Progress Service integration!

**Mapare manuala in Service layer:**
```java
private LessonDto mapLessonToDto(Lesson lesson) {
    LessonDto dto = new LessonDto(
        lesson.getId(),
        lesson.getUnit().getId(),
        lesson.getTitle(),
        lesson.getDescription(),
        lesson.getXpReward(),
        lesson.getOrderIndex()
    );
    
    // CRITICAL: Load exercises for Progress Service
    List<ExerciseDto> exerciseDtos = lesson.getExercises().stream()
            .map(this::mapExerciseToDto)
            .collect(Collectors.toList());
    
    dto.setExercises(exerciseDtos);
    
    return dto;
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
GET    /lessons/{id}            -> Detalii lectie (INCLUDE exercises array!)
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
GET    /exercises/{id}                -> Detalii exercitiu (USED BY PROGRESS SERVICE!)
POST   /exercises                     -> Creare exercitiu (JSONB arbitrar)
PUT    /exercises/{id}                -> Update (inclusiv contentData)
DELETE /exercises/{id}                -> Stergere
```

## Service Layer Logic

**ContentService** (@Transactional pe clasa):

**CRUD CourseUnits:**
- `getAllCourseUnits()` - ordonat dupa orderIndex
- `getCourseUnit(Long id)` - detalii unitate
- `createCourseUnit(CourseUnitDto)` - creare
- `updateCourseUnit(Long id, CourseUnitDto)` - update
- `deleteCourseUnit(Long id)` - stergere cascade

**CRUD Lessons:**
- `getLessonsByUnitId(Long unitId)` - lectiile unei unitati
- `getLesson(Long id)` - **CRITICAL: include exercises array pentru Progress Service**
- `createLesson(LessonDto)` - creare
- `updateLesson(Long id, LessonDto)` - permite move to other unit
- `deleteLesson(Long id)` - stergere cascade

**Materials:**
- `getMaterialsForLesson(Long lessonId)` - materiale lectie
- `addLessonMaterial(LessonMaterialDto)` - adauga material
- `deleteLessonMaterial(Long id)` - stergere

**Exercises:**
- `getExercisesForLesson(Long lessonId)` - exercitii lectie
- `getExercise(Long id)` - **CRITICAL: used by Progress Service for validation**
- `addExercise(ExerciseDto)` - creare cu JSONB content
- `updateExercise(Long id, ExerciseDto)` - update inclusiv contentData
- `deleteExercise(Long id)` - stergere

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
- Controller prinde exceptia → returneaza 404/500

## Repository Custom Queries

**ICourseUnitDao:**
```java
List<CourseUnit> findAllByOrderByOrderIndexAsc();
```

**ILessonDao:**
```java
List<Lesson> findByUnitIdOrderByOrderIndexAsc(Long unitId);
```

**IExerciseDao:**
```java
List<Exercise> findByLessonId(Long lessonId);
```

**ILessonMaterialDao:**
```java
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

**Docker Environment Variables (override local config):**
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://content-database:5432/content_database
  SPRING_DATASOURCE_USERNAME: postgres
  SPRING_DATASOURCE_PASSWORD: kuso
  SPRING_JPA_HIBERNATE_DDL_AUTO: update
  SPRING_JPA_SHOW_SQL: "true"
```

**Setup DB Local:**
```sql
CREATE DATABASE content_database;
```

**Rulare Local:**
```bash
mvn spring-boot:run
# Sau: Run ContentServiceApplication in IntelliJ
```

**Rulare Docker:**
```bash
docker-compose up --build content-service
```

## Integrare Cross-Service

**Progress Service Dependencies:**

Content Service expune 2 endpoints CRITICE pentru Progress Service:

1. **GET /api/content/exercises/{id}**
   - Progress Service apeleaza pentru validare exercise exists
   - Folosit in `ProgressService.submitAttempt()` pentru a obtine exercise details
   - Response TREBUIE sa includa: `id`, `lessonId`, `type`, `contentData`

2. **GET /api/content/lessons/{id}**
   - Progress Service apeleaza pentru calculare lesson progress
   - Response TREBUIE sa includa: `xpReward`, **`exercises` array** (List<ExerciseDto>)
   - Fara `exercises` array, Progress Service NU poate calcula completion percentage!

**Communication Pattern:** Synchronous REST API calls (RestTemplate)

**Flow Integrare:**
```
1. Student submitează attempt → Progress Service
2. Progress Service → GET /api/content/exercises/{id} → Content Service
3. Progress Service evaluează răspuns
4. Progress Service → GET /api/content/lessons/{lessonId} → Content Service
5. Progress Service calculează completion % based on exercises array
6. Dacă lesson completed → Progress Service → User Service (award XP)
```

**Design Decision:**
- Content validation este **synchronous** (nu event-driven)
- Motivație: Content-ul trebuie valid IMEDIAT la submit attempt
- Alternative (rejected): Cache exercise content in Progress Service → stale data risk

## Decizii Arhitecturale (AI Context)

**JSONB pentru Exercises:**
- Flexibilitate maxima: noi tipuri de exercitii fara schema migrations
- PostgreSQL native indexing pe JSON: `CREATE INDEX idx_exercise_type ON exercises ((content_data->>'type'));`
- Trade-off: validare structura JSON in Application Layer (nu in DB)
- Extensibil: adaugare tip nou = doar backend logic update, no database change

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
- **CRITICAL:** `getLesson()` TREBUIE sa populeze `exercises` array explicit!

**order_index Field:**
- Permite ordonare custom in UI (drag-and-drop reorder)
- Nu folosim AUTO_INCREMENT pentru order - teacher poate reseta ordinea
- Gap-uri permise (1, 2, 5, 10) - facilitate pentru inserari viitoare

**RuntimeException simplificat:**
- Pentru licenta: throw generic exceptions
- Productie: custom exceptions (EntityNotFoundException, ValidationException) + @ControllerAdvice

**LessonDto cu exercises array:**
- **BREAKING CHANGE vs initial design:** LessonDto NOW includes List<ExerciseDto>
- Motivație: Progress Service needs exercise list pentru completion calculation
- Alternative rejected: Separate endpoint GET /lessons/{id}/exercises → extra API call overhead

## Test Scenarios (Swagger)

### 1. Create Course Structure:
```
POST /units (HSK 1 Unit)
POST /lessons cu unitId (3 lectii)
POST /exercises cu lessonId (5 exercitii MULTIPLE_CHOICE)
GET /units/{id} → verifica cascade relationships
```

### 2. JSONB Flexibility:
```
POST exercise type MULTIPLE_CHOICE
POST exercise type TRANSLATION
POST exercise type FILL_BLANK
GET /lessons/{id}/exercises → verifica toate tipurile returned corect
```

### 3. Cascade Delete:
```
DELETE /units/{id}
Verifica in DB: lessons si exercises sterge automat
```

### 4. Lesson Move:
```
PUT /lessons/{id} cu unitId diferit
Verifica lesson.unit_id updated
```

### 5. Materials Attach:
```
POST /materials cu type VIDEO, PDF, LINK
GET /lessons/{id}/materials → verifica lista
```

### 6. Integration Test cu Progress Service:
```
GET /exercises/{id} → verifica response format corect
GET /lessons/{id} → CRITICAL: verifica exercises array present!
```

## Known Issues & Limitations

**Current Implementation:**
- No pagination pe GET endpoints (poate fi slow pentru multe records)
- No filtering/sorting options (doar basic orderIndex)
- No validation pe JSONB structure (backend trebuie sa parseze corect)
- No soft delete (DELETE permanently removes data)
- No audit trail (cine a creat/modificat ce si cand)

**Future Enhancements:**
- Add pagination: `GET /lessons?page=0&size=20`
- Add filtering: `GET /exercises?type=MULTIPLE_CHOICE&difficulty=1`
- Add JSONB schema validation cu JSON Schema
- Add created_at/updated_at timestamps
- Add created_by/updated_by (teacher_id FK)

## Docker Configuration

**Dockerfile:** Multi-stage build cu Amazon Corretto 21 Alpine

**Dependencies:**
- content-database (PostgreSQL 16)
- Network: chinese-learning-network

**Ports:**
- Internal: 8081
- External: 8081

**Health Check:** Implicit via Spring Boot Actuator (optional)

---

**Context AI:** README conceput pentru LLM assistance (debugging, extensii, integrare). Toate deciziile arhitecturale sunt justificate pentru intelegere rapida. Focus pe integration points cu Progress Service pentru a evita breaking changes.