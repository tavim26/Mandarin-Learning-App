# User Service — Frontend Integration Guide

## Base URL

```
http://localhost:8082
```

---

## Autentificare prin JWT

### Cum funcționează

1. Frontend-ul trimite email + parolă la `POST /api/auth/login`
2. Microserviciul returnează un **token JWT** în câmpul `token` din răspuns
3. Frontend-ul stochează token-ul (ex. `localStorage`)
4. La fiecare request ulterior, frontend-ul include token-ul în header-ul `Authorization`

### Header de autorizare

```
Authorization: Bearer <token>
```

**Exemplu:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Durata de viață a token-ului

Token-ul expiră după **24 de ore**. Nu există mecanism de refresh — la expirare, utilizatorul trebuie să se autentifice din nou.

### Payload-ul JWT (informații accesibile fără request)

Token-ul JWT conține în payload (decodabil client-side fără cheie secretă):
```json
{
  "sub": "user@email.com",
  "userId": 1,
  "role": "STUDENT",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## Roluri utilizator

Sistemul suportă exact trei roluri, **case-sensitive**:

| Valoare | Descriere |
|---|---|
| `"STUDENT"` | Utilizator de tip student |
| `"TEACHER"` | Utilizator de tip profesor |
| `"ADMIN"` | Administrator |

---

## Constrângeri câmpuri

| Câmp | Constrângere |
|---|---|
| `email` | Format email valid, unic în sistem |
| `password` | Minimum 8 caractere |
| `fullName` | Obligatoriu, non-gol |
| `role` | Exact `"STUDENT"`, `"TEACHER"` sau `"ADMIN"` |
| `nickname` | Unic în sistem |

---

## Format erori

Erorile returnează fie un **string simplu** ca body, fie **body gol** (în funcție de endpoint).

```
HTTP 400 → body: "mesaj de eroare" (string)
HTTP 401 → body: "mesaj de eroare" (string)
HTTP 404 → body gol
HTTP 204 → body gol (succes fără conținut)
```

---

---

# Endpoint-uri — Authentication

---

## POST `/api/auth/register`

Înregistrează un utilizator nou. Creează automat un profil de Student sau Teacher în funcție de rol.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "STUDENT | TEACHER | ADMIN"
}
```

**Exemplu:**
```json
{
  "email": "ion.popescu@email.com",
  "password": "parola123",
  "fullName": "Ion Popescu",
  "role": "STUDENT"
}
```

### Răspuns succes — `201 Created`

```json
{
  "userId": 1,
  "role": "STUDENT",
  "fullName": "Ion Popescu"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"Email already registered"` | Email-ul există deja în sistem |
| `400` | `"Role must be STUDENT, TEACHER or ADMIN"` | Valoare invalidă pentru `role` |

---

## POST `/api/auth/login`

Autentifică un utilizator și returnează token-ul JWT.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Exemplu:**
```json
{
  "email": "ion.popescu@email.com",
  "password": "parola123"
}
```

### Răspuns succes — `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "role": "STUDENT",
  "fullName": "Ion Popescu"
}
```

**Câmpuri de reținut după login:**
- `token` → stocat și trimis la fiecare request ulterior în header-ul `Authorization`
- `userId` → folosit ca `{id}` sau `{userId}` în endpoint-urile de profil
- `role` → determină ce secțiuni ale UI-ului sunt vizibile

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `401` | `"Account is banned"` | Contul a fost dezactivat |
| `401` | `"Invalid credentials"` | Email sau parolă incorecte |

---

---

# Endpoint-uri — User Management

---

## POST `/api/users`

Creează un utilizator nou. Diferit față de `/api/auth/register` — nu acceptă rolul `ADMIN`.

### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Body:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "STUDENT | TEACHER"
}
```

### Răspuns succes — `201 Created`

```json
{
  "id": 1,
  "fullName": "Ion Popescu",
  "role": "STUDENT"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"Email already registered"` | Email-ul există deja |
| `400` | `"Role must be STUDENT or TEACHER"` | Rol invalid sau `ADMIN` |

---

## GET `/api/users`

Returnează lista tuturor utilizatorilor din sistem.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

### Răspuns succes — `200 OK`

```json
[
  {
    "id": 1,
    "fullName": "Ion Popescu",
    "role": "STUDENT"
  },
  {
    "id": 2,
    "fullName": "Maria Ionescu",
    "role": "TEACHER"
  }
]
```

Returnează `[]` (array gol) dacă nu există utilizatori.

---

## GET `/api/users/{id}`

Returnează informațiile de bază ale unui utilizator după ID.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului (Long)

### Răspuns succes — `200 OK`

```json
{
  "id": 1,
  "fullName": "Ion Popescu",
  "role": "STUDENT"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există utilizator cu ID-ul dat |

---

## GET `/api/users/me`

Returnează profilul utilizatorului curent pe baza email-ului extras din JWT.

### ⚠️ Notă importantă pentru frontend

Acest endpoint este destinat apelului prin **API Gateway**, care extrage email-ul din token-ul JWT și îl setează automat în header-ul `X-User-Email`. Dacă apelezi microserviciul **direct** (fără Gateway), trebuie să setezi manual acest header cu email-ul utilizatorului autentificat.

### Request

**Headers:**
```
Authorization: Bearer <token>
X-User-Email: ion.popescu@email.com
```

### Răspuns succes — `200 OK`

```json
{
  "id": 1,
  "fullName": "Ion Popescu",
  "role": "STUDENT"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Email-ul nu corespunde niciunui utilizator activ |

---

## GET `/api/users/search?name={fragment}`

Caută utilizatori al căror nume complet conține fragmentul dat (case-insensitive).

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Query params:**
- `name` — fragmentul de căutat (string)

**Exemplu:**
```
GET /api/users/search?name=Ion
```

### Răspuns succes — `200 OK`

```json
[
  {
    "id": 1,
    "fullName": "Ion Popescu",
    "role": "STUDENT"
  }
]
```

Returnează `[]` dacă nu există niciun rezultat.

---

## PUT `/api/users/{id}/name`

Actualizează numele complet al unui utilizator.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

**Query params:**
- `newName` — noul nume complet (string)

**Exemplu:**
```
PUT /api/users/1/name?newName=Ion%20Georgescu
```

### Răspuns succes — `200 OK`

```json
{
  "id": 1,
  "fullName": "Ion Georgescu",
  "role": "STUDENT"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există utilizator cu ID-ul dat |

---

## PUT `/api/users/{id}/email`

Actualizează adresa de email a unui utilizator.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

**Query params:**
- `newEmail` — noul email (string, format valid)

**Exemplu:**
```
PUT /api/users/1/email?newEmail=ion.georgescu@email.com
```

### Răspuns succes — `200 OK`

```json
{
  "id": 1,
  "fullName": "Ion Popescu",
  "role": "STUDENT"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"Email already in use"` | Email-ul există deja în sistem |

---

## PUT `/api/users/{id}/password`

Schimbă parola unui utilizator. Necesită parola curentă pentru verificare.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

**Query params:**
- `oldPassword` — parola curentă
- `newPassword` — noua parolă (minimum 8 caractere)

**Exemplu:**
```
PUT /api/users/1/password?oldPassword=parola123&newPassword=parolaNoua456
```

### Răspuns succes — `204 No Content`

*(body gol)*

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"Current password is incorrect"` | Parola curentă nu este corectă |
| `400` | `"User not found with id: {id}"` | Nu există utilizator cu ID-ul dat |

---

## PUT `/api/users/{id}/password/reset`

Resetează parola unui utilizator fără a necesita parola curentă (operațiune de admin).

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

**Query params:**
- `newPassword` — noua parolă (minimum 8 caractere)

**Exemplu:**
```
PUT /api/users/1/password/reset?newPassword=parolaResetata123
```

### Răspuns succes — `204 No Content`

*(body gol)*

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există utilizator cu ID-ul dat |

---

## PUT `/api/users/{id}/ban`

Dezactivează un cont de utilizator fără a-l șterge. Utilizatorul banat nu se mai poate autentifica.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

### Răspuns succes — `204 No Content`

*(body gol)*

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"User is already banned"` | Contul este deja dezactivat |
| `400` | `"User not found with id: {id}"` | Nu există utilizator cu ID-ul dat |

---

## PUT `/api/users/{id}/unban`

Reactivează un cont dezactivat.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

### Răspuns succes — `204 No Content`

*(body gol)*

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `400` | `"User is not banned"` | Contul nu este dezactivat |
| `400` | `"User not found with id: {id}"` | Nu există utilizator cu ID-ul dat |

---

## DELETE `/api/users/{id}`

Șterge un utilizator și toate datele asociate (profil student/teacher, credențiale).

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `id` — ID-ul utilizatorului

### Răspuns succes — `204 No Content`

*(body gol)*

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există utilizator cu ID-ul dat |

---

---

# Endpoint-uri — Students

---

## GET `/api/users/students`

Returnează lista tuturor studenților cu profil complet.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

### Răspuns succes — `200 OK`

```json
[
  {
    "userId": 1,
    "fullName": "Ion Popescu",
    "role": "STUDENT",
    "nickname": "ionut99",
    "email": "ion.popescu@email.com"
  }
]
```

**Notă:** câmpul `nickname` poate fi `null` dacă studentul nu și-a setat încă un nickname.

Returnează `[]` dacă nu există studenți.

---

## GET `/api/users/students/{userId}`

Returnează datele specifice unui student după ID.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `userId` — ID-ul utilizatorului

### Răspuns succes — `200 OK`

```json
{
  "userId": 1,
  "nickname": "ionut99"
}
```

**Notă:** `nickname` poate fi `null`.

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există student cu ID-ul dat |

---

## GET `/api/users/students/search?nickname={fragment}`

Caută studenți al căror nickname conține fragmentul dat.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Query params:**
- `nickname` — fragmentul de căutat (string)

**Exemplu:**
```
GET /api/users/students/search?nickname=ion
```

### Răspuns succes — `200 OK`

```json
[
  {
    "userId": 1,
    "nickname": "ionut99"
  }
]
```

Returnează `[]` dacă nu există niciun rezultat.

---

## PUT `/api/users/students/{userId}/nickname`

Setează sau actualizează nickname-ul unui student. Nickname-ul trebuie să fie unic în sistem.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `userId` — ID-ul utilizatorului

**Query params:**
- `newNickname` — noul nickname (string, unic)

**Exemplu:**
```
PUT /api/users/students/1/nickname?newNickname=ionut2024
```

### Răspuns succes — `200 OK`

```json
{
  "userId": 1,
  "nickname": "ionut2024"
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există student cu ID-ul dat **sau** nickname-ul este deja folosit |

**⚠️ Atenție:** ambele erori returnează `404` cu body gol — nu se poate distinge între cele două cazuri din răspuns.

---

---

# Endpoint-uri — Teachers

---

## GET `/api/users/teachers`

Returnează lista tuturor profesorilor cu profil complet.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

### Răspuns succes — `200 OK`

```json
[
  {
    "userId": 2,
    "fullName": "Maria Ionescu",
    "role": "TEACHER",
    "title": "Prof. Dr.",
    "email": "maria.ionescu@email.com"
  }
]
```

**Notă:** câmpul `title` poate fi `""` (string gol) dacă profesorul nu și-a setat un titlu.

Returnează `[]` dacă nu există profesori.

---

## GET `/api/users/teachers/{userId}`

Returnează datele specifice unui profesor după ID.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `userId` — ID-ul utilizatorului

### Răspuns succes — `200 OK`

```json
{
  "userId": 2,
  "title": "Prof. Dr."
}
```

**Notă:** `title` poate fi `""` (string gol).

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există profesor cu ID-ul dat |

---

## PUT `/api/users/teachers/{userId}/title`

Actualizează titlul academic al unui profesor.

### Request

**Headers:**
```
Authorization: Bearer <token>
```

**Path params:**
- `userId` — ID-ul utilizatorului

**Query params:**
- `newTitle` — noul titlu (string)

**Exemplu:**
```
PUT /api/users/teachers/2/title?newTitle=Lector%20Dr.
```

### Răspuns succes — `200 OK`

```json
{
  "userId": 2,
  "title": "Lector Dr."
}
```

### Răspunsuri eroare

| Status | Body | Cauză |
|---|---|---|
| `404` | *(gol)* | Nu există profesor cu ID-ul dat |

---

---

# Referință rapidă

## Toate endpoint-urile

| Metodă | Endpoint | Body/Params | Succes |
|---|---|---|---|
| `POST` | `/api/auth/register` | JSON body | `201` |
| `POST` | `/api/auth/login` | JSON body | `200` + token |
| `POST` | `/api/users` | JSON body | `201` |
| `GET` | `/api/users` | — | `200` |
| `GET` | `/api/users/{id}` | path | `200` |
| `GET` | `/api/users/me` | header `X-User-Email` | `200` |
| `GET` | `/api/users/search?name=` | query | `200` |
| `PUT` | `/api/users/{id}/name?newName=` | path + query | `200` |
| `PUT` | `/api/users/{id}/email?newEmail=` | path + query | `200` |
| `PUT` | `/api/users/{id}/password?oldPassword=&newPassword=` | path + query | `204` |
| `PUT` | `/api/users/{id}/password/reset?newPassword=` | path + query | `204` |
| `PUT` | `/api/users/{id}/ban` | path | `204` |
| `PUT` | `/api/users/{id}/unban` | path | `204` |
| `DELETE` | `/api/users/{id}` | path | `204` |
| `GET` | `/api/users/students` | — | `200` |
| `GET` | `/api/users/students/{userId}` | path | `200` |
| `GET` | `/api/users/students/search?nickname=` | query | `200` |
| `PUT` | `/api/users/students/{userId}/nickname?newNickname=` | path + query | `200` |
| `GET` | `/api/users/teachers` | — | `200` |
| `GET` | `/api/users/teachers/{userId}` | path | `200` |
| `PUT` | `/api/users/teachers/{userId}/title?newTitle=` | path + query | `200` |

## Structuri de date returnate

**UserDto**
```json
{ "id": 1, "fullName": "string", "role": "string" }
```

**StudentDto**
```json
{ "userId": 1, "nickname": "string | null" }
```

**TeacherDto**
```json
{ "userId": 2, "title": "string" }
```

**StudentProfileDto**
```json
{ "userId": 1, "fullName": "string", "role": "STUDENT", "nickname": "string | null", "email": "string" }
```

**TeacherProfileDto**
```json
{ "userId": 2, "fullName": "string", "role": "TEACHER", "title": "string", "email": "string" }
```

**RegisterResponseDto**
```json
{ "userId": 1, "role": "string", "fullName": "string" }
```

**AuthResponseDto**
```json
{ "token": "string", "userId": 1, "role": "string", "fullName": "string" }
```