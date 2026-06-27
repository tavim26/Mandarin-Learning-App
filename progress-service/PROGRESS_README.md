# Progress Service — Documentație API pentru Frontend

## Prezentare generală

Microserviciul `progress-service` gestionează:
- Trimiterea și evaluarea răspunsurilor la exerciții
- Urmărirea progresului studenților per lecție și per unitate
- XP-ul și nivelul studenților
- Clasamentele globale și per lecție

**Port:** `8083`  
**Base URL (local):** `http://localhost:8083`  
**Base URL (Docker):** `http://progress-service:8083`  
**Swagger UI:** `http://localhost:8083/swagger-ui/index.html`

---

## Autentificare și autorizare

Fiecare request necesită două headere setate de API Gateway. **Nu există excepții**, cu excepția celor două endpoint-uri de leaderboard marcate explicit ca publice.

| Header | Tip | Valori posibile |
|--------|-----|-----------------|
| `X-User-Id` | `Long` | ID-ul utilizatorului autentificat curent |
| `X-User-Role` | `String` | `STUDENT` sau `ADMIN` |

### Reguli de acces

| Rol | Poate accesa |
|-----|-------------|
| `STUDENT` | Exclusiv propriile date (`studentId == X-User-Id`) |
| `ADMIN` | Datele oricărui student |

Violarea regulii returnează `403 Forbidden` cu body-ul `"Acces interzis"`.

---

## Modele de date (Response DTOs)

### ExerciseAttemptDto
Reprezintă o singură încercare a unui student la un exercițiu.

```json
{
  "id": 15,
  "studentId": 42,
  "exerciseId": 7,
  "attemptNumber": 2,
  "submittedAt": "2024-01-15T10:30:00",
  "submittedAnswer": { "selectedIndex": 1 },
  "isCorrect": true,
  "score": 100.00,
  "feedbackText": "Correct!"
}
```

| Câmp | Tip | Descriere |
|------|-----|-----------|
| `id` | `Long` | ID-ul încercării |
| `studentId` | `Long` | ID-ul studentului |
| `exerciseId` | `Long` | ID-ul exercițiului |
| `attemptNumber` | `Integer` | Numărul încercării (1, 2, 3...) |
| `submittedAt` | `LocalDateTime` | Momentul trimiterii |
| `submittedAnswer` | `Object` | Răspunsul trimis (format variabil — vezi secțiunea de formate) |
| `isCorrect` | `Boolean` | `true` dacă `score >= 70` |
| `score` | `BigDecimal` | Scor 0.00 – 100.00 |
| `feedbackText` | `String` | Mesaj de feedback pentru student |

---

### StudentLessonProgressDto
Reprezintă progresul unui student la o lecție.

```json
{
  "id": 3,
  "studentId": 42,
  "lessonId": 5,
  "status": "IN_PROGRESS",
  "completionPct": 66.67,
  "xpAwarded": null,
  "startedAt": "2024-01-15T09:00:00",
  "lastAccessedAt": "2024-01-15T10:30:00",
  "completedAt": null
}
```

| Câmp | Tip | Descriere |
|------|-----|-----------|
| `id` | `Long` | ID-ul înregistrării de progres |
| `studentId` | `Long` | ID-ul studentului |
| `lessonId` | `Long` | ID-ul lecției |
| `status` | `String` | `NOT_STARTED` / `IN_PROGRESS` / `COMPLETED` |
| `completionPct` | `BigDecimal` | Procent de completare 0.00 – 100.00 |
| `xpAwarded` | `Integer` | XP acordat la completare; `null` dacă lecția nu e completă |
| `startedAt` | `LocalDateTime` | Prima accesare; `null` dacă nu a început |
| `lastAccessedAt` | `LocalDateTime` | Ultima activitate |
| `completedAt` | `LocalDateTime` | Momentul completării; `null` dacă nu e completă |

---

### StudentReplicaDto
Reprezintă profilul de XP și nivel al unui student.

```json
{
  "studentId": 42,
  "xpTotal": 250,
  "level": 3
}
```

---

### StudentSummaryDto
Rezumat complet pentru dashboard-ul studentului.

```json
{
  "studentId": 42,
  "xpTotal": 250,
  "level": 3,
  "completedLessonsCount": 5,
  "inProgressLessonsCount": 2
}
```

> Dacă studentul nu a trimis nicio încercare, `xpTotal` = `0`, `level` = `1`, contoarele = `0`.

---

### StudentUnitProgressDto
Reprezintă progresul unui student la o unitate de lecții.

```json
{
  "unitId": 1,
  "studentId": 42,
  "totalLessons": 10,
  "completedLessons": 3,
  "inProgressLessons": 2,
  "notStartedLessons": 5,
  "unitCompletionPct": 30.00
}
```

> `unitCompletionPct` se calculează exclusiv pe baza lecțiilor cu status `COMPLETED` (nu `IN_PROGRESS`).

---

## Valori posibile și logică de business

### Lesson Status

| Valoare | Când apare |
|---------|-----------|
| `NOT_STARTED` | Studentul nu a rezolvat corect niciun exercițiu din lecție |
| `IN_PROGRESS` | Cel puțin un exercițiu rezolvat corect, dar nu toate |
| `COMPLETED` | Toate exercițiile din lecție au cel puțin o încercare corectă |

> O lecție trece în `COMPLETED` automat la trimiterea încercării care completează ultimul exercițiu. Nu există un endpoint separat de "completare".

### Logica score / isCorrect

```
isCorrect = (score >= 70)
```

Un exercițiu este considerat corect indiferent de câte încercări a necesitat — contează ca studentul să fi obținut cel puțin o dată `isCorrect = true`. Odată rezolvat corect, exercițiul rămâne marcat ca rezolvat chiar dacă studentul mai încearcă și greșește ulterior.

### Calculul nivelului

```
level = (xpTotal / 100) + 1
```

| XP | Nivel |
|----|-------|
| 0 – 99 | 1 |
| 100 – 199 | 2 |
| 200 – 299 | 3 |
| ... | ... |

### Acordarea XP

XP-ul este acordat o singură dată, la prima completare a lecției. La completări ulterioare (dacă este posibil scenariul), XP-ul **nu** se mai acordă din nou. `xpAwarded` din `StudentLessonProgressDto` reflectă XP-ul efectiv acordat pentru acea lecție.

---

## Formate submittedAnswer per tip de exercițiu

Câmpul `submittedAnswer` din request variază în funcție de câmpul `type` al exercițiului (furnizat de `content-service`).

### MULTIPLE_CHOICE

```json
{
  "selectedIndex": 2
}
```

`selectedIndex`: indexul 0-based al opțiunii selectate din lista de opțiuni a exercițiului.

**Scorare:** 100 dacă corect, 0 dacă incorect.

**Feedback posibil:**
- `"Correct!"`
- `"Incorrect. The correct answer was: {optiunea_corecta}"`

---

### TRANSLATION

```json
{
  "translation": "buna ziua"
}
```

**Scorare:**
- 100 — răspuns identic cu unul din răspunsurile acceptate (case-insensitive, fără spații multiple)
- 50 — overlap de cuvinte ≥ 40% față de răspunsul principal (credit parțial)
- 0 — overlap < 40%

**Feedback posibil:**
- `"Correct translation!"`
- `"Partially correct (X% words matched). Expected: {raspuns_corect}"`
- `"Incorrect. Correct translation: {raspuns_corect}"`

---

### FILL_BLANK

```json
{
  "answers": ["raspuns1", "raspuns2"]
}
```

Ordinea elementelor din array trebuie să corespundă ordinii blank-urilor din exercițiu. Comparația este case-insensitive și ignoră spațiile de la capete.

**Scorare:** proporțional — `(blank-uri_corecte / total_blank-uri) * 100`

**Feedback posibil:**
- `"All answers are correct!"`
- `"You filled X out of Y blanks correctly."`

---

### MATCHING

```json
{
  "matches": {
    "你好": "buna ziua",
    "谢谢": "multumesc",
    "再见": "la revedere"
  }
}
```

Cheia este termenul din coloana stângă, valoarea este perechea selectată din coloana dreaptă. Comparația este exactă (case-sensitive).

**Scorare:** proporțional — `(perechi_corecte / total_perechi) * 100`

**Feedback posibil:**
- `"All pairs matched correctly!"`
- `"You matched X out of Y pairs correctly."`

---

### ORDERING

```json
{
  "order": ["我", "叫", "李明"]
}
```

Array-ul conține toate cuvintele exercițiului în ordinea aleasă de student. Trebuie să conțină exact același număr de elemente ca exercițiul.

**Scorare:** proporțional după poziții corecte — `(cuvinte_pe_pozitie_corecta / total_cuvinte) * 100`

**Feedback posibil:**
- `"Correct! The sentence order is right."` (score = 100)
- `"Almost correct! X out of Y words in the right position."` (score ≥ 70)
- `"Incorrect. You placed X out of Y words correctly. Correct order: ..."` (score < 70)

---

## Endpointuri

### 1. Trimite o încercare la un exercițiu

```
POST /api/progress/attempts
Headers: X-User-Id, X-User-Role
```

**Request body:**
```json
{
  "exerciseId": 7,
  "submittedAnswer": {
    "selectedIndex": 1
  }
}
```

Studentul trimite întotdeauna pentru propriul ID (preluat din `X-User-Id`). Nu există câmp `studentId` în request.

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `201 Created` | `ExerciseAttemptDto` | Încercare procesată cu succes |
| `400 Bad Request` | `String` | `exerciseId` lipsă sau exercițiu inexistent |
| `503 Service Unavailable` | `String` | `content-service` indisponibil |

---

### 2. Istoricul încercărilor unui student la un exercițiu

```
GET /api/progress/attempts/student/{studentId}/exercise/{exerciseId}
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `ExerciseAttemptDto[]` | Succes — array ordonat după `attemptNumber` ASC |
| `403 Forbidden` | `"Acces interzis"` | STUDENT accesează datele altui student |
| `404 Not Found` | — | Nicio încercare găsită |

---

### 3. Progresul unui student la o lecție

```
GET /api/progress/lessons/student/{studentId}/lesson/{lessonId}
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentLessonProgressDto` | Succes |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |
| `404 Not Found` | — | Studentul nu a început lecția |

---

### 4. Tot progresul unui student (toate lecțiile)

```
GET /api/progress/lessons/student/{studentId}
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentLessonProgressDto[]` | Succes — array poate fi `[]` dacă nu a început nicio lecție |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |

---

### 5. Lecțiile în curs ale unui student

```
GET /api/progress/lessons/student/{studentId}/in-progress
Headers: X-User-Id, X-User-Role
```

Returnează doar înregistrările cu `status = "IN_PROGRESS"`.

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentLessonProgressDto[]` | Succes — array poate fi `[]` |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |

---

### 6. Clasamentul unei lecții (top 10)

```
GET /api/progress/lessons/{lessonId}/leaderboard
```

**Public — nu necesită headere.**

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentLessonProgressDto[]` | Succes — maxim 10 înregistrări, ordonat după `completionPct` DESC |

---

### 7. Rezumatul dashboard-ului unui student

```
GET /api/progress/students/{studentId}/summary
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentSummaryDto` | Succes |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |

---

### 8. Progresul unui student la o unitate

```
GET /api/progress/units/{unitId}/student/{studentId}/progress
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentUnitProgressDto` | Succes |
| `400 Bad Request` | `String` | Unitatea nu există în `content-service` |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |
| `503 Service Unavailable` | `String` | `content-service` indisponibil |

---

### 9. Clasamentul global după XP (top 10)

```
GET /api/progress/students/leaderboard
```

**Public — nu necesită headere.**

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentReplicaDto[]` | Succes — maxim 10 studenți, ordonat după `xpTotal` DESC |

---

### 10. Profilul XP al unui student

```
GET /api/progress/students/{studentId}
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentReplicaDto` | Succes |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |
| `404 Not Found` | — | Studentul nu a trimis nicio încercare (nu există în sistem) |

---

### 11. Verifică dacă un student există în sistem

```
GET /api/progress/students/{studentId}/exists
Headers: X-User-Id, X-User-Role
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `true` / `false` | `false` dacă studentul nu a trimis nicio încercare |
| `403 Forbidden` | `"Acces interzis"` | Acces la datele altui student |

---

### 12. Toți studenții — doar ADMIN

```
GET /api/progress/students/admin/all
Headers: X-User-Role (trebuie să fie "ADMIN")
```

**Responses:**

| Status | Body | Când |
|--------|------|------|
| `200 OK` | `StudentReplicaDto[]` | Succes — toți studenții, ordonat după `xpTotal` DESC |
| `403 Forbidden` | `"Acces interzis"` | Utilizatorul nu este ADMIN |

---

## Referință rapidă

| Metodă | Path | Descriere | Acces |
|--------|------|-----------|-------|
| `POST` | `/api/progress/attempts` | Trimite o încercare | Autentificat |
| `GET` | `/api/progress/attempts/student/{studentId}/exercise/{exerciseId}` | Istoricul încercărilor | Propriu / ADMIN |
| `GET` | `/api/progress/lessons/student/{studentId}/lesson/{lessonId}` | Progres la o lecție | Propriu / ADMIN |
| `GET` | `/api/progress/lessons/student/{studentId}` | Tot progresul studentului | Propriu / ADMIN |
| `GET` | `/api/progress/lessons/student/{studentId}/in-progress` | Lecții în curs | Propriu / ADMIN |
| `GET` | `/api/progress/lessons/{lessonId}/leaderboard` | Clasament lecție top 10 | **Public** |
| `GET` | `/api/progress/students/{studentId}/summary` | Dashboard summary | Propriu / ADMIN |
| `GET` | `/api/progress/units/{unitId}/student/{studentId}/progress` | Progres la o unitate | Propriu / ADMIN |
| `GET` | `/api/progress/students/leaderboard` | Clasament global XP top 10 | **Public** |
| `GET` | `/api/progress/students/{studentId}` | Profil XP student | Propriu / ADMIN |
| `GET` | `/api/progress/students/{studentId}/exists` | Verifică existența studentului | Propriu / ADMIN |
| `GET` | `/api/progress/students/admin/all` | Toți studenții | **Doar ADMIN** |