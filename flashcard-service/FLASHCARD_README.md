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

**Scala de calitate (quality) — mapare recomandata frontend:**

| Valoare | Buton recomandat | Interpretare |
|---|---|---|
| 0 | Again | Raspuns complet gresit — reset total |
| 1 | Again (hard) | Gresit cu ezitare |
| 2 | Hard | Corect dar foarte dificil |
| 3 | Good | Corect cu efort moderat |
| 4 | Good (easy) | Corect, relativ usor |
| 5 | Easy | Corect fara efort |

> Frontend-ul este responsabil pentru traducerea butoanelor in valori numerice 0-5. Backend-ul primeste exclusiv valori numerice.

**Reguli SM-2:**

Raspuns incorect (quality < 3):
```
repetitionCount = 0  (reset total)
intervalDays    = 1  (apare din nou maine)
```

Raspuns corect (quality >= 3):
```
repetitionCount = 1 → intervalDays = 1 zi
repetitionCount = 2 → intervalDays = 6 zile
repetitionCount >= 3 → intervalDays = intervalDays_curent × easinessFactor (rotunjit)
```

Formula easinessFactor:
```
EF_nou = EF_curent + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
EF minim: 1.3
```

**Clasificarea cardurilor pentru frontend:**

| Categorie | Conditie | Culoare recomandata UI |
|---|---|---|
| `new` | Fara progress record | Gri |
| `learning` | `repetitionCount < 3` | Galben |
| `mature` | `intervalDays >= 21` | Verde |
| `due` | `nextReviewAt <= now` sau `new` | Rosu / badge |

---

## Modele de date (DTO-uri)

### `FlashcardSetDto`
```json
{
  "id": 1,
  "studentId": 1,
  "title": "HSK 1 - Vocabular de baza",
  "description": "Cele mai frecvente 150 de cuvinte HSK nivel 1",
  "cardCount": 50
}
```

> `cardCount` este intotdeauna populat — reprezinta numarul total de flashcard-uri din set.

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
> Frontend-ul detecteaza cardurile nevazute prin `id == null`.

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

### `FlashcardSetStatsDto`
```json
{
  "setId": 1,
  "totalCards": 50,
  "newCards": 20,
  "learningCards": 15,
  "matureCards": 10,
  "dueToday": 23,
  "averageEasinessFactor": 2.31
}
```

> `newCards` = carduri fara progress record.
> `learningCards` = `repetitionCount < 3`.
> `matureCards` = `intervalDays >= 21`.
> `dueToday` = carduri cu `nextReviewAt <= now` + carduri `new`.
> `averageEasinessFactor` = `2.5` daca nu exista niciun progress record.

### `TotalDueStatsDto`
```json
{
  "totalDue": 23,
  "bySet": [
    { "setId": 1, "setTitle": "HSK 1", "dueCount": 15 },
    { "setId": 2, "setTitle": "HSK 2", "dueCount": 8 }
  ]
}
```

> Seturile cu `dueCount = 0` sunt excluse din lista `bySet`.
> `totalDue` este suma tuturor `dueCount` din `bySet`.

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
- **Nota frontend:** fiecare element contine `cardCount` — nu sunt necesare requesturi suplimentare pentru numarul de carduri per set

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

#### `GET /api/flashcards/sets/{setId}/stats`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** calculeaza distributia cardurilor din set per categorie SM-2 pentru studentul autentificat.
- **Response `200`:** `FlashcardSetStatsDto`
- **Response `404`:** setul nu exista
- **Nota frontend:** folosit pentru a popula progress bar-ul si badge-urile de categorie pe pagina de detaliu a unui set

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
- **Response `200`:** lista de `FlashcardProgressDto`
- **Nota frontend:** cardurile nevazute au `id: null`. La primul `POST /reviews` pentru un card `new`, backend-ul creeaza automat progress record-ul. Lista se fetch-uieste o singura data la inceputul sesiunii si se itereaza local.

---

#### `GET /api/flashcards/reviews/due/all`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** returneaza numarul total de carduri scadente azi pentru studentul autentificat, agregat peste toate seturile. Seturile cu `dueCount = 0` sunt excluse din raspuns.
- **Response `200`:** `TotalDueStatsDto`
- **Nota frontend:** endpoint-ul principal pentru dashboard home — "Ai X carduri scadente azi" cu breakdown per set, intr-un singur request

---

#### `GET /api/flashcards/reviews/history/{studentId}/{flashcardId}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `FlashcardReviewDto` ordonata cronologic ascendent
- **Nota frontend:** folosit pentru graficul de evolutie al scorurilor per card

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
| GET | /api/flashcards/sets/{setId}/stats | | own | | ✓ |
| POST | /api/flashcards/cards | | own | | ✓ |
| GET | /api/flashcards/sets/{setId}/cards | | own | | ✓ |
| GET | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| PUT | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| DELETE | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| POST | /api/flashcards/reviews | | own | | ✓ |
| GET | /api/flashcards/reviews/due/{studentId} | | own | | ✓ |
| GET | /api/flashcards/reviews/due/all | | own | | ✓ |
| GET | /api/flashcards/reviews/history/{studentId}/{flashcardId} | | own | | ✓ |
| GET | /api/flashcards/reviews/progress/{studentId}/{flashcardId} | | own | | ✓ |

> **own** = API Gateway verifica daca `userId` din JWT claims coincide cu `{studentId}` din path sau cu `X-User-Id` header.
> **TEACHER** nu are acces la niciun endpoint al acestui serviciu.
> Ownership-ul pe operatiile de mutatie (PUT, DELETE, POST cards) este verificat suplimentar intern in service prin compararea `studentId` cu proprietarul setului parinte.
> Endpoint-urile fara `{studentId}` in path (`POST /sets`, `POST /reviews`, `GET /reviews/due/all`, `GET /sets/{setId}/stats`) preiau identitatea exclusiv din `X-User-Id` header — API Gateway nu are ce verifica in path.

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
| `400` | Campuri obligatorii lipsa (`title`, `frontText`, `backText`) sau `quality` in afara intervalului 0-5 |
| `403` | Studentul incearca sa modifice sau stearga resursa altui student |
| `404` | Set, flashcard sau progress record inexistent |

---

## Fluxuri frontend recomandate

### Flux 1 — Dashboard home
```
GET /api/flashcards/reviews/due/all
  Header: X-User-Id: {userId}
  → afiseaza "Ai {totalDue} carduri scadente azi"
  → afiseaza lista bySet cu dueCount per set
```

### Flux 2 — Lista seturi
```
GET /api/flashcards/sets/student/{userId}
  Header: X-User-Id: {userId}
  → afiseaza fiecare set cu titlu, descriere, cardCount

Optional per set (la hover / expandare):
GET /api/flashcards/sets/{setId}/stats
  Header: X-User-Id: {userId}
  → populeaza progress bar: new (gri) / learning (galben) / mature (verde)
  → afiseaza badge dueToday
```

### Flux 3 — Sesiune de recenzie per set
```
1. GET /api/flashcards/reviews/due/{userId}?setId={setId}
   Header: X-User-Id: {userId}
   → incarca lista completa O SINGURA DATA, stocheaza local in state

2. Pentru fiecare FlashcardProgressDto din lista:
   a. Fetch card: GET /api/flashcards/cards/{flashcardId}
   b. Afiseaza frontText
   c. Student apasa "Arata raspunsul" → afiseaza backText (flip card)
   d. Student apasa buton → mapat la quality:
      Again=0, Hard=2, Good=3, Easy=5
   e. POST /api/flashcards/reviews
      Header: X-User-Id: {userId}
      Body: { flashcardId, quality }
   f. Avanseaza la urmatorul card

3. La final → afiseaza sumar (total recenzate, distributie butoane)

NOTA: Cardurile cu id=null sunt carduri nevazute (new).
Sunt tratate identic vizual. La primul POST /reviews, backend-ul
creeaza automat progress record-ul.
```

### Flux 4 — Creare set si adaugare carduri
```
1. POST /api/flashcards/sets
   Header: X-User-Id: {userId}
   Body: { title, description }
   → raspuns: FlashcardSetDto cu id-ul nou creat

2. POST /api/flashcards/cards (repetat per card)
   Header: X-User-Id: {userId}
   Body: { setId, frontText, backText }
   → cardurile noi apar automat in sesiunea de recenzie urmatoare
     (clasificate ca "new", incluse in getDueFlashcards)
```

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
│       ├── DueCountBySetDto.java
│       ├── FlashcardDto.java
│       ├── FlashcardProgressDto.java
│       ├── FlashcardReviewDto.java
│       ├── FlashcardSetDto.java
│       ├── FlashcardSetStatsDto.java
│       ├── ReviewResultDto.java
│       ├── SubmitReviewRequest.java
│       ├── TotalDueStatsDto.java
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