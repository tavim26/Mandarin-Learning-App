# flashcard-service

Microserviciu responsabil pentru gestionarea seturilor de flashcard-uri, a cardurilor individuale si a recenziilor bazate pe algoritmul SM-2 (Spaced Repetition).

- **Port:** `8086`
- **Baza de date:** PostgreSQL — `flashcard_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8086/swagger-ui/index.html`

---

## Tech Stack

- Java 21, Spring Boot, Spring Data JPA
- PostgreSQL
- SpringDoc (Swagger)

---

## Dependente inter-servicii

Serviciul nu are dependente inter-servicii. Opereaza independent.

`studentId` este preluat exclusiv din header-ul `X-User-Id` injectat de API Gateway.

---

## Schema bazei de date

```
flashcard_sets
├── id            BIGINT PK (auto-generated)
├── student_id    BIGINT (not null)
├── title         VARCHAR(255) (not null)
└── description   TEXT (nullable)

flashcards
├── id            BIGINT PK (auto-generated)
├── set_id        BIGINT FK → flashcard_sets.id (not null)
├── front_text    TEXT (not null)
└── back_text     TEXT (not null)

INDEX: idx_flashcards_set_id ON flashcards(set_id)

flashcard_progress
├── id                BIGINT PK (auto-generated)
├── student_id        BIGINT (not null)
├── flashcard_id      BIGINT FK → flashcards.id (not null)
├── easiness_factor   DECIMAL(4,2) (not null, default 2.5)
├── interval_days     INTEGER (not null, default 0)
├── repetition_count  INTEGER (not null, default 0)
├── next_review_at    DATETIME (nullable)
└── last_reviewed_at  DATETIME (nullable)

UNIQUE CONSTRAINT: (student_id, flashcard_id)
INDEX: idx_progress_student_flashcard ON flashcard_progress(student_id, flashcard_id)
INDEX: idx_progress_student_next_review ON flashcard_progress(student_id, next_review_at)

flashcard_reviews
├── id            BIGINT PK (auto-generated)
├── student_id    BIGINT (not null)
├── flashcard_id  BIGINT FK → flashcards.id (not null)
├── reviewed_at   DATETIME (not null)
└── quality       INTEGER (not null) — scala SM-2: 0-5

INDEX: idx_reviews_student_id ON flashcard_reviews(student_id)
INDEX: idx_reviews_student_flashcard ON flashcard_reviews(student_id, flashcard_id)
```

**Relatii:**
- Un `FlashcardSet` contine mai multe `Flashcard` (CASCADE DELETE, orphanRemoval)
- `flashcard_progress` — stare mutabila SM-2, unica per pereche (student, flashcard)
- `flashcard_reviews` — audit log append-only, multiple inregistrari per pereche (student, flashcard)

---

## Algoritmul SM-2

Serviciul implementeaza algoritmul SuperMemo 2 (SM-2) pentru spatiere optima a recenziilor.

**Stare SM-2 per card per student:**

| Camp | Valoare initiala | Semnificatie |
|---|---|---|
| `easinessFactor` | 2.5 | Factorul de usurinta al cardului pentru studentul dat |
| `intervalDays` | 0 | Numarul de zile pana la urmatoarea recenzie |
| `repetitionCount` | 0 | Numarul de raspunsuri corecte consecutive |

**Scala de calitate (quality):**

| Valoare | Interpretare |
|---|---|
| 0-2 | Raspuns incorect — reset complet al progresului |
| 3-5 | Raspuns corect — intervalul creste proportional cu easinessFactor |

**Formula easinessFactor:**
```
EF_nou = EF_curent + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
EF minim: 1.3
```

**Calculul intervalului (raspuns corect):**
```
repetitionCount = 1 → interval = 1 zi
repetitionCount = 2 → interval = 6 zile
repetitionCount >= 3 → interval = interval_curent × easinessFactor (rotunjit)
```

**Raspuns incorect:**
```
repetitionCount = 0 (reset)
interval = 1 zi
```

**Nota:** Frontend-ul este responsabil pentru traducerea butoanelor (Again / Hard / Good / Easy) in valori numerice 0-5. Backend-ul primeste exclusiv valori numerice.

---

## Modele de date (DTO-uri)

### `FlashcardSetDto`
```json
{
  "id": 1,
  "studentId": 1,
  "title": "HSK 1 - Vocabular de baza",
  "description": "Cele mai frecvente 150 de cuvinte HSK nivel 1"
}
```

### `FlashcardDto`
```json
{
  "id": 1,
  "setId": 1,
  "frontText": "你好",
  "backText": "Buna ziua — nǐ hǎo"
}
```

### `FlashcardProgressDto`
```json
{
  "id": 1,
  "studentId": 1,
  "flashcardId": 1,
  "easinessFactor": 2.50,
  "intervalDays": 6,
  "repetitionCount": 2,
  "nextReviewAt": "2024-01-07T10:00:00",
  "lastReviewedAt": "2024-01-01T10:00:00"
}
```

> `id` este `null` pentru cardurile care nu au fost niciodata recenzate (fara progress record).
> `nextReviewAt` si `lastReviewedAt` sunt `null` pentru carduri nevazute.

### `FlashcardReviewDto`
```json
{
  "id": 1,
  "studentId": 1,
  "flashcardId": 1,
  "reviewedAt": "2024-01-01T10:00:00",
  "quality": 4
}
```

### `ReviewResultDto`
```json
{
  "review": {
    "id": 1,
    "studentId": 1,
    "flashcardId": 1,
    "reviewedAt": "2024-01-01T10:00:00",
    "quality": 4
  },
  "progress": {
    "id": 1,
    "studentId": 1,
    "flashcardId": 1,
    "easinessFactor": 2.50,
    "intervalDays": 1,
    "repetitionCount": 1,
    "nextReviewAt": "2024-01-02T10:00:00",
    "lastReviewedAt": "2024-01-01T10:00:00"
  }
}
```

### `CreateFlashcardSetRequest` (request body)
```json
{
  "title": "HSK 1 - Vocabular de baza",
  "description": "Cele mai frecvente 150 de cuvinte HSK nivel 1"
}
```

> `studentId` este absent din request body — este extras din header-ul `X-User-Id`.

### `UpdateFlashcardSetRequest` (request body)
```json
{
  "title": "HSK 1 - Vocabular de baza (actualizat)",
  "description": "Descriere actualizata"
}
```

### `CreateFlashcardRequest` (request body)
```json
{
  "setId": 1,
  "frontText": "你好",
  "backText": "Buna ziua — nǐ hǎo"
}
```

### `UpdateFlashcardRequest` (request body)
```json
{
  "frontText": "谢谢",
  "backText": "Multumesc — xiè xie"
}
```

### `SubmitReviewRequest` (request body)
```json
{
  "flashcardId": 1,
  "quality": 4
}
```

> `studentId` este absent din request body — este extras din header-ul `X-User-Id`.

---

## Endpoint-uri

### Seturi de flashcard-uri — `/api/flashcards/sets`

#### `POST /api/flashcards/sets`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `CreateFlashcardSetRequest`
- **Comportament:** creeaza un set nou gol pentru studentul identificat prin `X-User-Id`.
- **Response `201`:** `FlashcardSetDto`
- **Response `400`:** `title` lipsa

---

#### `GET /api/flashcards/sets/student/{studentId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `FlashcardSetDto` ordonata descrescator dupa `id`

---

#### `GET /api/flashcards/sets/{setId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `FlashcardSetDto`
- **Response `404`:** setul nu exista

---

#### `PUT /api/flashcards/sets/{setId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `UpdateFlashcardSetRequest`
- **Comportament:** modifica titlul si descrierea. Verifica intern ca studentul din `X-User-Id` este proprietarul setului.
- **Response `200`:** `FlashcardSetDto` actualizat
- **Response `403`:** studentul nu este proprietarul setului
- **Response `404`:** setul nu exista

---

#### `DELETE /api/flashcards/sets/{setId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** sterge setul si toate flashcard-urile din el (CASCADE). Verifica ownership.
- **Response `204`:** sters cu succes
- **Response `403`:** studentul nu este proprietarul setului
- **Response `404`:** setul nu exista

---

### Flashcard-uri individuale — `/api/flashcards/cards`

#### `POST /api/flashcards/cards`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `CreateFlashcardRequest`
- **Comportament:** adauga un card intr-un set existent. Verifica ca studentul din `X-User-Id` este proprietarul setului.
- **Response `201`:** `FlashcardDto`
- **Response `403`:** studentul nu este proprietarul setului
- **Response `404`:** setul nu exista

---

#### `GET /api/flashcards/sets/{setId}/cards`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `FlashcardDto`
- **Response `404`:** setul nu exista

---

#### `GET /api/flashcards/cards/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `FlashcardDto`
- **Response `404`:** flashcard-ul nu exista

---

#### `PUT /api/flashcards/cards/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `UpdateFlashcardRequest`
- **Comportament:** modifica `frontText` si `backText`. Verifica ownership prin setul parinte.
- **Response `200`:** `FlashcardDto` actualizat
- **Response `403`:** studentul nu este proprietarul setului parinte
- **Response `404`:** flashcard-ul nu exista

---

#### `DELETE /api/flashcards/cards/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** sterge flashcard-ul. Verifica ownership prin setul parinte.
- **Response `204`:** sters cu succes
- **Response `403`:** studentul nu este proprietarul setului parinte
- **Response `404`:** flashcard-ul nu exista

---

### Recenzii si progres SM-2 — `/api/flashcards/reviews`

#### `POST /api/flashcards/reviews`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `SubmitReviewRequest`
- **Comportament:** ruleaza algoritmul SM-2 cu scorul primit. Daca nu exista progress record pentru perechea (student, flashcard), il creeaza automat. Salveaza recenzia in audit log si actualizeaza starea SM-2.
- **Response `201`:** `ReviewResultDto`
- **Response `404`:** flashcard-ul nu exista

---

#### `GET /api/flashcards/reviews/due/{studentId}?setId={setId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Query param obligatoriu:** `setId`
- **Comportament:** returneaza doua categorii de carduri:
    1. Carduri cu progress record si `nextReviewAt <= momentul curent` (scadente)
    2. Carduri fara niciun progress record (nevazute niciodata)

  Cardurile nevazute au `id: null` in `FlashcardProgressDto`.
- **Response `200`:** lista de `FlashcardProgressDto`

---

#### `GET /api/flashcards/reviews/history/{studentId}/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `FlashcardReviewDto` ordonata cronologic ascendent

---

#### `GET /api/flashcards/reviews/progress/{studentId}/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `FlashcardProgressDto`
- **Response `404`:** nu exista progress record pentru aceasta pereche

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/flashcards/sets | | own | | ✓ |
| GET | /api/flashcards/sets/student/{studentId} | | own | | ✓ |
| GET | /api/flashcards/sets/{setId} | | own | | ✓ |
| PUT | /api/flashcards/sets/{setId} | | own | | ✓ |
| DELETE | /api/flashcards/sets/{setId} | | own | | ✓ |
| POST | /api/flashcards/cards | | own | | ✓ |
| GET | /api/flashcards/sets/{setId}/cards | | own | | ✓ |
| GET | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| PUT | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| DELETE | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| POST | /api/flashcards/reviews | | own | | ✓ |
| GET | /api/flashcards/reviews/due/{studentId} | | own | | ✓ |
| GET | /api/flashcards/reviews/history/{studentId}/{flashcardId} | | own | | ✓ |
| GET | /api/flashcards/reviews/progress/{studentId}/{flashcardId} | | own | | ✓ |

> **own** = API Gateway verifica daca `userId` din JWT claims coincide cu `{studentId}` din path.
> **TEACHER** nu are acces la niciun endpoint al acestui serviciu.
> Ownership-ul pe operatiile de mutatie (PUT, DELETE) este verificat suplimentar intern in service.
> Toate endpoint-urile necesita header-ul `X-User-Id` injectat de API Gateway.

---

## Headers injectate de API Gateway

| Header | Tip | Descriere |
|---|---|---|
| `X-User-Id` | `Long` | `userId` din JWT claims |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Coduri de eroare

| Cod | Cauza |
|---|---|
| `400` | Campuri obligatorii lipsa (`title`, `frontText`, `backText`) |
| `403` | Studentul incearca sa modifice sau stearga resursa altui student |
| `404` | Set, flashcard sau progress record inexistent |

---

## Structura pachetelor

```
flashcardservice/
├── domain/
│   ├── Flashcard.java
│   ├── FlashcardProgress.java
│   ├── FlashcardReview.java
│   ├── FlashcardSet.java
│   ├── dao/
│   │   ├── IFlashcardDao.java
│   │   ├── IFlashcardProgressDao.java
│   │   ├── IFlashcardReviewDao.java
│   │   └── IFlashcardSetDao.java
│   └── dto/
│       ├── CreateFlashcardRequest.java
│       ├── CreateFlashcardSetRequest.java
│       ├── FlashcardDto.java
│       ├── FlashcardProgressDto.java
│       ├── FlashcardReviewDto.java
│       ├── FlashcardSetDto.java
│       ├── ReviewResultDto.java
│       ├── SubmitReviewRequest.java
│       ├── UpdateFlashcardRequest.java
│       └── UpdateFlashcardSetRequest.java
├── repository/
│   ├── entities/
│   │   ├── FlashcardEntity.java
│   │   ├── FlashcardProgressEntity.java
│   │   ├── FlashcardReviewEntity.java
│   │   └── FlashcardSetEntity.java
│   ├── jpa/
│   │   ├── FlashcardJpaRepository.java
│   │   ├── FlashcardProgressJpaRepository.java
│   │   ├── FlashcardReviewJpaRepository.java
│   │   └── FlashcardSetJpaRepository.java
│   ├── FlashcardDao.java
│   ├── FlashcardProgressDao.java
│   ├── FlashcardReviewDao.java
│   └── FlashcardSetDao.java
├── service/
│   ├── FlashcardSetService.java
│   ├── ReviewService.java
│   └── Sm2Algorithm.java
└── controller/
    └── FlashcardController.java
```