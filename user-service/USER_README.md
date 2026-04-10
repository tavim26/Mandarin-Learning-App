# user-service

- **Port:** `8082` (accesat prin API Gateway pe `http://localhost:8080`)
- **Bază de date:** PostgreSQL — `user_database`
- **Emite JWT:** Da, doar la `POST /api/auth/login`
- **Autorizarea pe rol** se face în API Gateway, nu în acest serviciu

---

## Roluri

| Rol     | Descriere                                                       |
|---------|-----------------------------------------------------------------|
| STUDENT | Are profil în tabela `students` cu câmp `nickname`              |
| TEACHER | Are profil în tabela `teachers` cu câmp `title`                 |
| ADMIN   | Fără profil în `students`/`teachers`                            |

---

## JWT

Emis la login. Trebuie trimis ca header la orice request autentificat:
```
Authorization: Bearer <token>
```

**Claims payload:**

| Claim  | Tip    | Valoare                   |
|--------|--------|---------------------------|
| sub    | String | email-ul utilizatorului   |
| userId | Long   | ID-ul utilizatorului      |
| role   | String | STUDENT / TEACHER / ADMIN |
| iat    | Date   | timestamp emitere         |
| exp    | Date   | timestamp expirare        |

**Logout:** gestionat exclusiv client-side (șterge token-ul din storage). Token-ul rămâne valid până la expirare.

---

## DTO-uri

### Request DTOs

**RegisterRequestDto** — folosit la `POST /api/auth/register` și `POST /api/users`
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "STUDENT | TEACHER | ADMIN"
}
```

**AuthRequestDto** — folosit la `POST /api/auth/login`
```json
{
  "email": "string",
  "password": "string"
}
```

---

### Response DTOs

**AuthResponseDto** — returnat la login
```json
{
  "token": "jwt_string",
  "userId": 1,
  "role": "STUDENT",
  "fullName": "string"
}
```

**RegisterResponseDto** — returnat la register
```json
{
  "userId": 1,
  "role": "STUDENT",
  "fullName": "string"
}
```

**UserDto** — returnat de majoritatea endpoint-urilor de tip User
```json
{
  "id": 1,
  "fullName": "string",
  "role": "STUDENT"
}
```

**StudentDto** — returnat de endpoint-urile de tip Student (fără profil complet)
```json
{
  "userId": 1,
  "nickname": "string"
}
```

**StudentProfileDto** — returnat la `GET /api/users/students` (profil complet, pentru tabel admin)
```json
{
  "userId": 1,
  "fullName": "string",
  "role": "STUDENT",
  "nickname": "string",
  "email": "string"
}
```

**TeacherDto** — returnat de endpoint-urile de tip Teacher (fără profil complet)
```json
{
  "userId": 1,
  "title": "string"
}
```

**TeacherProfileDto** — returnat la `GET /api/users/teachers` (profil complet, pentru tabel admin)
```json
{
  "userId": 1,
  "fullName": "string",
  "role": "TEACHER",
  "title": "string",
  "email": "string"
}
```

---

## Endpoint-uri

> Parametrii de tip `@RequestParam` se trimit în URL.
> Exemplu: `PUT /api/users/1/email?newEmail=test@test.com`

---

### Auth — public, fără token

#### `POST /api/auth/register`
```
Request body:  RegisterRequestDto
Response 201:  RegisterResponseDto
Response 400:  email deja înregistrat sau rol invalid
```

#### `POST /api/auth/login`
```
Request body:  AuthRequestDto
Response 200:  AuthResponseDto
Response 401:  credențiale invalide sau cont banat
```

---

### Users — `/api/users`

#### `POST /api/users` — ADMIN only
```
Request body:  RegisterRequestDto (rol: STUDENT sau TEACHER)
Response 201:  UserDto
Response 400:  email deja înregistrat sau rol invalid
```

#### `GET /api/users` — ADMIN only
```
Response 200:  List<UserDto>
```

#### `GET /api/users/{id}` — ADMIN only
```
Response 200:  UserDto
Response 404
```

#### `GET /api/users/search?name={fragment}` — ADMIN only
```
Response 200:  List<UserDto>
```

#### `GET /api/users/me` — STUDENT, TEACHER, ADMIN
```
Header necesar (injectat de Gateway din JWT): X-User-Email
Response 200:  UserDto
Response 404
```

#### `PUT /api/users/{id}/name?newName={value}` — ADMIN only
```
Response 200:  UserDto
Response 404
```

#### `PUT /api/users/{id}/email?newEmail={value}` — ADMIN, own
```
Response 200:  UserDto
Response 400:  email deja înregistrat
Response 404
```

#### `PUT /api/users/{id}/password?oldPassword={value}&newPassword={value}` — ADMIN, own
```
Response 204
Response 400:  parola veche incorectă
Response 404
```

#### `PUT /api/users/{id}/password/reset?newPassword={value}` — ADMIN only
```
Response 204
Response 404
```

#### `PUT /api/users/{id}/ban` — ADMIN only
```
Response 204:  cont dezactivat (userul nu se poate loga)
Response 400:  contul este deja banat
Response 404
```

#### `PUT /api/users/{id}/unban` — ADMIN only
```
Response 204:  cont reactivat
Response 400:  contul nu este banat
Response 404
```

#### `DELETE /api/users/{id}` — ADMIN only
```
Response 204:  șters definitiv din DB (cascade: Student/Teacher asociat)
Response 404
```

---

### Students — `/api/users/students`

#### `GET /api/users/students` — ADMIN only
```
Response 200:  List<StudentProfileDto>
```

#### `GET /api/users/students/{userId}` — ADMIN, STUDENT (own)
```
Response 200:  StudentDto
Response 404
```

#### `GET /api/users/students/search?nickname={fragment}` — ADMIN only
```
Response 200:  List<StudentDto>
```

#### `PUT /api/users/students/{userId}/nickname?newNickname={value}` — ADMIN, STUDENT (own)
```
Response 200:  StudentDto
Response 400:  nickname deja folosit
Response 404
```

---

### Teachers — `/api/users/teachers`

#### `GET /api/users/teachers` — ADMIN only
```
Response 200:  List<TeacherProfileDto>
```

#### `GET /api/users/teachers/{userId}` — ADMIN, TEACHER (own)
```
Response 200:  TeacherDto
Response 404
```

#### `PUT /api/users/teachers/{userId}/title?newTitle={value}` — ADMIN, TEACHER (own)
```
Response 200:  TeacherDto
Response 404
```

---

## Tabel autorizare (pentru API Gateway)

| Method | Path                                  | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|---------------------------------------|--------|---------|---------|-------|
| POST   | /api/auth/register                    | ✓      |         |         |       |
| POST   | /api/auth/login                       | ✓      |         |         |       |
| POST   | /api/users                            |        |         |         | ✓     |
| GET    | /api/users                            |        |         |         | ✓     |
| GET    | /api/users/{id}                       |        |         |         | ✓     |
| GET    | /api/users/search                     |        |         |         | ✓     |
| GET    | /api/users/me                         |        | ✓       | ✓       | ✓     |
| PUT    | /api/users/{id}/name                  |        |         |         | ✓     |
| PUT    | /api/users/{id}/email                 |        | own     | own     | ✓     |
| PUT    | /api/users/{id}/password              |        | own     | own     | ✓     |
| PUT    | /api/users/{id}/password/reset        |        |         |         | ✓     |
| PUT    | /api/users/{id}/ban                   |        |         |         | ✓     |
| PUT    | /api/users/{id}/unban                 |        |         |         | ✓     |
| DELETE | /api/users/{id}                       |        |         |         | ✓     |
| GET    | /api/users/students                   |        |         |         | ✓     |
| GET    | /api/users/students/{userId}          |        | own     |         | ✓     |
| GET    | /api/users/students/search            |        |         |         | ✓     |
| PUT    | /api/users/students/{userId}/nickname |        | own     |         | ✓     |
| GET    | /api/users/teachers                   |        |         |         | ✓     |
| GET    | /api/users/teachers/{userId}          |        |         | own     | ✓     |
| PUT    | /api/users/teachers/{userId}/title    |        |         | own     | ✓     |

> **own** = Gateway verifică că `userId` din path coincide cu `userId` din JWT claims.
> **GET /api/users/me** = Gateway injectează header `X-User-Email` din JWT înainte de forwarding.