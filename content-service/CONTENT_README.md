# content-service

## 1. Scopul Microserviciului

Microserviciu responsabil cu gestionarea **conținutului educațional** al platformei de învățare a limbii chineze. Administrează structura ierarhică a cursului: unități → lecții → exerciții/materiale.

Face parte dintr-o arhitectură de microservicii. Rulează pe portul `8081`.

---

## 2. Arhitectura și Structura Pachetelor

Arhitectura respectă principiile **Domain-Driven Design (DDD)**.

```
com.chineselearning.contentservice
├── controller/
│   └── ContentController.java         # REST endpoints, depinde doar de dto + service
├── domain/
│   ├── dao/
│   │   ├── ICourseUnitDao.java         # JpaRepository pentru CourseUnit
│   │   ├── ILessonDao.java             # JpaRepository pentru Lesson
│   │   ├── ILessonMaterialDao.java     # JpaRepository pentru LessonMaterial
│   │   └── IExerciseDao.java           # JpaRepository pentru Exercise
│   ├── dto/
│   │   ├── CourseUnitDto.java
│   │   ├── LessonDto.java              # include List<ExerciseDto> exercises
│   │   ├── LessonMaterialDto.java
│   │   └── ExerciseDto.java
│   ├── CourseUnit.java                 # Entitate JPA
│   ├── Lesson.java                     # Entitate JPA
│   ├── LessonMaterial.java             # Entitate JPA
│   └── Exercise.java                   # Entitate JPA, contentData stocat ca JSONB
└── service/
    └── ContentService.java             # Toată logica de business, @Transactional
```

**Reguli arhitecturale stricte:**
- Controller-ul NU accesează DAO sau entități direct — doar DTO și Service
- Mapping-ul entitate ↔ DTO se face exclusiv în `ContentService` prin metode private helper
- Nu se folosește MapStruct sau alte librării de mapping

---

## 3. Modelul Domeniului

### Ierarhia entităților

```
CourseUnit (1)
    └── Lesson (*)
            ├── Exercise (*)
            └── LessonMaterial (*)
```

### CourseUnit
| Câmp | Tip | Constrângeri |
|---|---|---|
| id | Long | PK, auto-generated |
| title | String | NOT NULL |
| description | String | TEXT |
| hskLevel | Integer | nullable |
| orderIndex | Integer | NOT NULL |

### Lesson
| Câmp | Tip | Constrângeri |
|---|---|---|
| id | Long | PK, auto-generated |
| unit | CourseUnit | FK, NOT NULL |
| title | String | NOT NULL |
| description | String | TEXT |
| xpReward | Integer | NOT NULL |
| orderIndex | Integer | NOT NULL |

### LessonMaterial
| Câmp | Tip | Constrângeri |
|---|---|---|
| id | Long | PK, auto-generated |
| lesson | Lesson | FK, NOT NULL |
| title | String | NOT NULL |
| type | String | NOT NULL |
| url | String | NOT NULL, max 1000 chars |

### Exercise
| Câmp | Tip | Constrângeri |
|---|---|---|
| id | Long | PK, auto-generated |
| lesson | Lesson | FK, NOT NULL |
| type | String | NOT NULL |
| prompt | String | TEXT, NOT NULL |
| difficulty | Integer | nullable |
| contentData | Map<String, Object> | JSONB în PostgreSQL |

### Relații JPA
- `CourseUnit → Lesson`: `@OneToMany(cascade = ALL, orphanRemoval = true)`
- `Lesson → Exercise`: `@OneToMany(cascade = ALL, orphanRemoval = true)`
- `Lesson → LessonMaterial`: `@OneToMany(cascade = ALL, orphanRemoval = true)`
- Toate relațiile `@ManyToOne` folosesc `FetchType.LAZY`

---

## 4. Endpoints REST

Base path: `/api/content`

### Course Units
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/units` | Returnează toate unitățile, ordonate după `orderIndex` ASC |
| GET | `/units/{id}` | Returnează o unitate după ID |
| POST | `/units` | Creează o unitate nouă |
| PUT | `/units/{id}` | Actualizează o unitate existentă |
| DELETE | `/units/{id}` | Șterge unitatea și toate lecțiile asociate (cascade) |

### Lessons
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/units/{unitId}/lessons` | Returnează lecțiile unei unități, ordonate după `orderIndex` ASC |
| GET | `/lessons/{id}` | Returnează lecția cu lista de exerciții inclusă în răspuns |
| POST | `/lessons` | Creează o lecție nouă |
| PUT | `/lessons/{id}` | Actualizează lecția; permite reasignarea la altă unitate |
| DELETE | `/lessons/{id}` | Șterge lecția și exercițiile/materialele asociate |

### Materials
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/lessons/{lessonId}/materials` | Returnează materialele unei lecții |
| POST | `/materials` | Adaugă un material nou la o lecție |
| DELETE | `/materials/{id}` | Șterge un material |

### Exercises
| Metodă | Path | Descriere |
|---|---|---|
| GET | `/lessons/{lessonId}/exercises` | Returnează exercițiile unei lecții |
| GET | `/exercises/{id}` | Returnează un exercițiu după ID |
| POST | `/exercises` | Adaugă un exercițiu nou la o lecție |
| PUT | `/exercises/{id}` | Actualizează un exercițiu existent |
| DELETE | `/exercises/{id}` | Șterge un exercițiu |

Documentație Swagger disponibilă la: `http://localhost:8081/swagger-ui/index.html`

---

## 5. Dependențe Externe

- **Baza de date:** PostgreSQL — tabel `course_units`, `lessons`, `lesson_materials`, `exercises`
- **JSONB:** Câmpul `contentData` din `Exercise` folosește `@JdbcTypeCode(SqlTypes.JSON)` și este stocat ca `jsonb` în PostgreSQL
- **Alte microservicii:** Nu există comunicare sincronă cu alte microservicii în implementarea curentă

---

## 6. Decizii de Design

- **Un singur ContentService** gestionează toate cele 4 agregate. SRP este violat intenționat pentru simplitate, dat fiind stadiul proiectului.
- **Mapping manual** entitate ↔ DTO prin metode private helper în service. Nu se folosește MapStruct.
- **`getLesson(id)`** returnează exercițiile incluse în DTO. **`getLessonsByUnitId()`** returnează lecțiile fără exerciții. Comportament intenționat diferențiat.
- **`updateExercise`** nu permite reasignarea lecției parinte. **`updateLesson`** permite reasignarea unității parinte. Inconsistență existentă, nerezolvată.
- **`@Transactional`** aplicat la nivel de clasă — toate metodele, inclusiv cele de citire, rulează cu tranzacții read-write. `readOnly = true` nu este aplicat.

---



## 8. Tehnologii

- Java 21
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Hibernate
- SpringDoc OpenAPI (Swagger)