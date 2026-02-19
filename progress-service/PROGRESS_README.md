# progress-service

## 1. Responsabilitate

Microserviciu responsabil cu **urmarirea progresului studentilor** pe platforma de invatare a limbii chineze.
Gestioneaza trei domenii principale:
- Inregistrarea si evaluarea incercarilor la exercitii
- Calculul si actualizarea progresului per lectie
- Gestionarea XP-ului si nivelului studentilor (replica locala)

Ruleaza pe portul `8083`.

---

## 2. Arhitectura si Structura Pachetelor

Arhitectura respecta principiile **Domain-Driven Design (DDD)**.

```
com.chineselearning.progressservice
├── clients/
│   └── ContentServiceClient.java       # Client HTTP REST catre content-service
├── config/
│   └── AppConfig.java                  # Configurare RestTemplate
├── controller/
│   ├── ProgressController.java         # Endpointuri pentru incercari si progres lectii
│   └── StudentReplicaController.java   # Endpointuri pentru XP, nivel si clasament
├── domain/
│   ├── dao/
│   │   ├── IExerciseAttemptDao.java
│   │   ├── IStudentLessonProgressDao.java
│   │   └── IStudentReplicaDao.java
│   ├── dto/
│   │   ├── ExerciseAttemptDto.java
│   │   ├── StudentLessonProgressDto.java
│   │   ├── StudentReplicaDto.java
│   │   ├── SubmitAttemptRequest.java
│   │   ├── EvaluationResultDto.java        # Rezultatul evaluarii unui raspuns
│   │   ├── ExerciseResponseDto.java        # DTO deserializare raspuns content-service
│   │   └── LessonResponseDto.java          # DTO deserializare raspuns content-service
│   ├── ExerciseAttempt.java
│   ├── StudentLessonProgress.java
│   └── StudentReplica.java
└── service/
    ├── EvaluationService.java          # Logica de evaluare per tip de exercitiu
    ├── ProgressService.java            # Logica principala de business
    └── StudentReplicaService.java      # Gestionare XP, nivel, clasament
```

**Reguli arhitecturale:**
- Controller-ul depinde doar de `dto` si `service`
- Mapping entitate <-> DTO se face exclusiv in `service` prin metode private helper
- Nu se foloseste MapStruct

---

## 3. Modelul Domeniului

### ExerciseAttempt
| Camp | Tip | Constrangeri |
|---|---|---|
| id | Long | PK, auto-generated |
| studentId | Long | NOT NULL |
| exerciseId | Long | NOT NULL |
| attemptNumber | Integer | NOT NULL |
| submittedAt | LocalDateTime | NOT NULL |
| submittedAnswer | Map<String, Object> | JSONB, NOT NULL |
| isCorrect | Boolean | NOT NULL |
| score | BigDecimal | NOT NULL, precision 5 scale 2 |
| feedbackText | String | TEXT, nullable |

**Indecsi:** `(student_id, exercise_id, submitted_at)`, `(exercise_id, is_correct)`

---

### StudentLessonProgress
| Camp | Tip | Constrangeri |
|---|---|---|
| id | Long | PK, auto-generated |
| studentId | Long | NOT NULL |
| lessonId | Long | NOT NULL |
| status | String | NOT NULL, max 20 chars |
| completionPct | BigDecimal | NOT NULL, precision 5 scale 2 |
| xpAwarded | Integer | nullable |
| startedAt | LocalDateTime | nullable |
| lastAccessedAt | LocalDateTime | nullable |
| completedAt | LocalDateTime | nullable |

**Constrangere unica:** `(student_id, lesson_id)` — un student are o singura inregistrare de progres per lectie.

**Statusuri posibile:** `NOT_STARTED` → `IN_PROGRESS` → `COMPLETED`

**Indecsi:** `(student_id, status)`

---

### StudentReplica
| Camp | Tip | Constrangeri |
|---|---|---|
| studentId | Long | PK (nu auto-generated) |
| xpTotal | Integer | NOT NULL, default 0 |
| level | Integer | NOT NULL, default 1 |

**Formula nivel:** `level = (xpTotal / 100) + 1`

**Rol:** Replica locala a datelor din `user-service` — evita apeluri sincrone inter-servicii pentru operatii frecvente (clasament, XP).

**Indecsi:** `(xp_total DESC)` pentru clasament

---

## 4. Endpoints REST

Base path: `/api/progress`

### Incercari la exercitii
| Metoda | Path | Descriere | Request | Response |
|---|---|---|---|---|
| POST | `/attempts` | Trimite un raspuns pentru evaluare | `SubmitAttemptRequest` | `201 ExerciseAttemptDto` / `400` / `503` |
| GET | `/attempts/student/{studentId}/exercise/{exerciseId}` | Toate incercarile unui student la un exercitiu | - | `200 List<ExerciseAttemptDto>` |

### Progres lectii
| Metoda | Path | Descriere | Response |
|---|---|---|---|
| GET | `/lessons/student/{studentId}/lesson/{lessonId}` | Progresul unui student la o lectie specifica | `200 StudentLessonProgressDto` / `404` |
| GET | `/lessons/student/{studentId}` | Tot progresul unui student | `200 List<StudentLessonProgressDto>` |
| GET | `/lessons/student/{studentId}/in-progress` | Doar lectiile cu status IN_PROGRESS | `200 List<StudentLessonProgressDto>` |
| GET | `/lessons/{lessonId}/leaderboard` | Top 10 studenti dupa completionPct | `200 List<StudentLessonProgressDto>` |

Base path: `/api/progress/students`

### Studenti (XP si nivel)
| Metoda | Path | Descriere | Response |
|---|---|---|---|
| GET | `/leaderboard` | Top 10 studenti dupa XP total | `200 List<StudentReplicaDto>` |
| GET | `/{studentId}` | XP si nivel ale unui student | `200 StudentReplicaDto` / `404` |
| GET | `/{studentId}/exists` | Verifica daca replica studentului exista | `200 Boolean` |
| GET | `/admin/all` | Toate replicile (admin, restrictionat prin Gateway) | `200 List<StudentReplicaDto>` |

Documentatie Swagger: `http://localhost:8083/swagger-ui/index.html`

---

## 5. DTO-uri

### SubmitAttemptRequest (request)
| Camp | Tip | Validare |
|---|---|---|
| studentId | Long | @NotNull |
| exerciseId | Long | @NotNull |
| submittedAnswer | Map<String, Object> | @NotNull |

### ExerciseAttemptDto (response)
Contine toate campurile din entitatea `ExerciseAttempt`.

### StudentLessonProgressDto (response)
Contine toate campurile din entitatea `StudentLessonProgress`.

### StudentReplicaDto (response)
| Camp | Tip |
|---|---|
| studentId | Long |
| xpTotal | Integer |
| level | Integer |

### ExerciseResponseDto (intern — deserializare content-service)
| Camp | Tip |
|---|---|
| id | Long |
| lessonId | Long |
| type | String |
| contentData | Map<String, Object> |

### LessonResponseDto (intern — deserializare content-service)
| Camp | Tip |
|---|---|
| id | Long |
| xpReward | Integer |
| exercises | List<ExerciseResponseDto> |

### EvaluationResultDto (intern — intre EvaluationService si ProgressService)
| Camp | Tip |
|---|---|
| score | BigDecimal |
| feedback | String |
| correct | boolean (score >= 70) |

---

## 6. Flux principal — submitAttempt

```
POST /attempts
    │
    ├── [HTTP] ContentServiceClient.getExercise(exerciseId)
    │       → ExerciseResponseDto (type, lessonId, contentData)
    │
    ├── [HTTP] ContentServiceClient.getLesson(lessonId)
    │       → LessonResponseDto (xpReward, exercises[])
    │
    ├── EvaluationService.evaluate(type, contentData, submittedAnswer)
    │       → EvaluationResultDto (score, feedback, isCorrect)
    │
    └── @Transactional: saveAttemptAndUpdateProgress()
            ├── ensureStudentReplicaExists()     // lazy creation replica
            ├── exerciseAttemptDao.save()
            ├── calculateCompletionPct()
            ├── fetchOrCreateProgress()
            ├── handleStatusTransition()
            │       └── [daca COMPLETED si XP neacordat] awardXpToStudent()
            └── lessonProgressDao.save()
```

**Decizie critica:** Apelurile HTTP catre `content-service` se executa **in afara tranzactiei JPA**. Tranzactia este deschisa abia dupa ce toate datele externe sunt disponibile.

---

## 7. Logica de Evaluare — EvaluationService

### MULTIPLE_CHOICE
Comparatie directa intre `correctIndex` (din `contentData`) si `selectedIndex` (din `submittedAnswer`). Rezultat binar: 100 sau 0 puncte.

### FILL_BLANK
Comparatie `equalsIgnoreCase` cu `trim` pentru fiecare spatiu in parte. Scorul este proportional cu numarul de spatii corecte.

### MATCHING
Comparatie pereche cu pereche intre `pairs` (din `contentData`) si `matches` (din `submittedAnswer`). Scorul este proportional cu numarul de perechi asociate corect.

### TRANSLATION
Evaluare in 3 niveluri:
1. **Potrivire exacta** (dupa normalizare lowercase + trim) cu oricare din `acceptedAnswers` → 100 puncte
2. **Credit partial** — overlap de cuvinte >= 40% fata de primul raspuns acceptat → 50 puncte
3. **Incorect** — overlap sub 40% → 0 puncte

**Prag de corectitudine global:** `isCorrect = true` daca `score >= 70`, indiferent de tipul exercitiului. Logica centralizata in constructorul `EvaluationResultDto`.

---

## 8. Dependente Externe

| Serviciu | Comunicare | Endpointuri apelate |
|---|---|---|
| `content-service` (port 8081) | HTTP REST sincron via `RestTemplate` | `GET /api/content/exercises/{id}`, `GET /api/content/lessons/{id}` |
| `user-service` (port 8082) | **Niciuna** — decuplat complet | - |
| `API Gateway` | Primeste request-uri rutate prin Gateway | - |

`progress-service` nu apeleaza `user-service`. `studentId` este extras din JWT-ul validat de API Gateway — daca request-ul ajunge la `progress-service`, studentul este deja autentificat.

---

## 9. Decizii de Design

- **Lazy creation StudentReplica:** Replica unui student este creata la primul `submitAttempt`, nu la inregistrare. Elimina necesitatea sincronizarii cu `user-service` la register.
- **XP acordat o singura data:** Verificare `xpAwarded == null || xpAwarded == 0` previne acordarea duplicata a XP-ului la re-completarea unei lectii deja finalizate.
- **Apeluri HTTP in afara tranzactiei:** `submitAttempt` nu este `@Transactional`. Tranzactia JPA este deschisa abia in `saveAttemptAndUpdateProgress()`, dupa finalizarea apelurilor HTTP.
- **`ExerciseResponseDto` / `LessonResponseDto`:** DTO-uri interne folosite exclusiv pentru deserializarea raspunsurilor de la `content-service`. Nu sunt expuse prin niciun endpoint.
- **`EvaluationResultDto`:** Transporta rezultatul evaluarii intre `EvaluationService` si `ProgressService`. Include campul calculat `isCorrect` (score >= 70) direct in constructor.
- **Metode de citire cu `@Transactional(readOnly = true)`:** Aplicate explicit pe toate metodele de tip GET din `ProgressService` si `StudentReplicaService`.

---

## 10. Tehnologii

- Java 21
- Spring Boot
- Spring Data JPA
- PostgreSQL
- Hibernate (JSONB via `@JdbcTypeCode(SqlTypes.JSON)`)
- RestTemplate pentru comunicare HTTP
- SpringDoc OpenAPI (Swagger)
- Jakarta Validation (`@NotNull`, `@Valid`)