# user-service

Microserviciu responsabil pentru gestionarea utilizatorilor, autentificare și autorizare prin JWT.

- **Port:** `8082`
- **Bază de date:** PostgreSQL — `user_database`
- **Emite JWT:** Da (doar la `/api/auth/login`)

---

## Tech Stack

- Java 21, Spring Boot, Spring Security, Spring Data JPA
- PostgreSQL, jjwt, BCrypt

---

## Schema bazei de date

```
credentials
├── id            BIGINT PK (auto-generated)
├── email         VARCHAR (unique, not null)
├── password_hash VARCHAR (not null)
├── role          VARCHAR (not null) — STUDENT | TEACHER | ADMIN
└── created_at    TIMESTAMP (not null)

users
├── id            BIGINT PK (FK → credentials.id, @MapsId)
└── full_name     VARCHAR (not null)

students
├── user_id       BIGINT PK (FK → users.id, @MapsId)
└── nickname      VARCHAR(50) (nullable)

teachers
├── user_id       BIGINT PK (FK → users.id, @MapsId)
└── title         VARCHAR (nullable)
```

**Relații:** `Credential` este agregatul root. `User` preia ID-ul din `Credential`. `Student` și `Teacher` preiau ID-ul din `User`. Un utilizator are fie `Student`, fie `Teacher`, fie niciunul (ADMIN).

---

## Roluri și reguli de business

| Rol     | Descriere                                                  |
|---------|------------------------------------------------------------|
| STUDENT | Are înregistrare în tabela `students` cu câmp `nickname`   |
| TEACHER | Are înregistrare în tabela `teachers` cu câmp `title`      |
| ADMIN   | Fără înregistrare în `students`/`teachers`                 |

- `POST /api/auth/register` acceptă: `STUDENT`, `TEACHER`, `ADMIN`
- `POST /api/users` (admin only) acceptă: `STUDENT`, `TEACHER`

---

## JWT

- **Algoritm:** HS256
- **Secret:** cheie Base64 de 256 biți (din `application.properties`)
- **Expirare:** configurabilă prin `application.security.jwt.expiration` (ms)

**Claims payload:**

| Claim   | Tip    | Descriere                    |
|---------|--------|------------------------------|
| sub     | String | email-ul utilizatorului      |
| userId  | Long   | ID-ul din tabela credentials |
| role    | String | STUDENT / TEACHER / ADMIN    |
| iat     | Date   | emis la                      |
| exp     | Date   | expiră la                    |

---

## Endpoint-uri

### Auth — `/api/auth`

#### `POST /api/auth/register`
- **Autorizare:** public
- **Request body:**
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string",
  "role": "STUDENT | TEACHER | ADMIN"
}
```
- **Response `201`:**
```json
{
  "userId": 1,
  "role": "STUDENT",
  "fullName": "string"
}
```
- **Response `400`:** email deja înregistrat sau rol invalid

---

#### `POST /api/auth/login`
- **Autorizare:** public
- **Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```
- **Response `200`:**
```json
{
  "token": "jwt_string",
  "userId": 1,
  "role": "STUDENT",
  "fullName": "string"
}
```
- **Response `401`:** credențiale invalide

---

### Users — `/api/users`

#### `POST /api/users`
- **Autorizare:** ADMIN only
- **Request body:** identic cu `/api/auth/register` (rol: `STUDENT` sau `TEACHER`)
- **Response `201`:**
```json
{
  "id": 1,
  "fullName": "string",
  "role": "STUDENT"
}
```

---

#### `GET /api/users`
- **Autorizare:** ADMIN only
- **Response `200`:** listă de `UserDto`

---

#### `GET /api/users/{id}`
- **Autorizare:** ADMIN only
- **Response `200`:** `UserDto` / `404` dacă nu există

---

#### `GET /api/users/search?name={fragment}`
- **Autorizare:** ADMIN only
- **Response `200`:** listă de `UserDto` filtrate după `fullName`

---

#### `PUT /api/users/{id}/name?newName={value}`
- **Autorizare:** ADMIN only
- **Response `200`:** `UserDto` actualizat / `404`

---

#### `DELETE /api/users/{id}`
- **Autorizare:** ADMIN only
- **Response `204`** / `404`
- Cascade delete: șterge și înregistrările din `students`/`teachers`

---

#### `GET /api/users/students/{userId}`
- **Autorizare:** ADMIN, STUDENT (own)
- **Response `200`:**
```json
{
  "userId": 1,
  "nickname": "string"
}
```

---

#### `PUT /api/users/students/{userId}/nickname?newNickname={value}`
- **Autorizare:** ADMIN, STUDENT (own)
- **Response `200`:** `StudentDto` actualizat / `404`

---

#### `GET /api/users/teachers/{userId}`
- **Autorizare:** ADMIN, TEACHER (own)
- **Response `200`:**
```json
{
  "userId": 1,
  "title": "string"
}
```

---

#### `PUT /api/users/teachers/{userId}/title?newTitle={value}`
- **Autorizare:** ADMIN, TEACHER (own)
- **Response `200`:** `TeacherDto` actualizat / `404`

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path                                    | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|-----------------------------------------|--------|---------|---------|-------|
| POST   | /api/auth/register                      | ✓      |         |         |       |
| POST   | /api/auth/login                         | ✓      |         |         |       |
| POST   | /api/users                              |        |         |         | ✓     |
| GET    | /api/users                              |        |         |         | ✓     |
| GET    | /api/users/{id}                         |        |         |         | ✓     |
| GET    | /api/users/search                       |        |         |         | ✓     |
| PUT    | /api/users/{id}/name                    |        |         |         | ✓     |
| DELETE | /api/users/{id}                         |        |         |         | ✓     |
| GET    | /api/users/students/{userId}            |        | own     |         | ✓     |
| PUT    | /api/users/students/{userId}/nickname   |        | own     |         | ✓     |
| GET    | /api/users/teachers/{userId}            |        |         | own     | ✓     |
| PUT    | /api/users/teachers/{userId}/title      |        |         | own     | ✓     |

> **own** = API Gateway verifică dacă `userId` din path coincide cu `userId` din JWT claims.

---

## Structura pachetelor

```
userservice/
├── domain/
│   ├── Credential.java         (agregat root)
│   ├── User.java
│   ├── Student.java
│   ├── Teacher.java
│   ├── dao/                    (interfețe DAO — fără dependențe Spring)
│   └── dto/                    (Auth, Register, User, Student, Teacher DTOs)
├── repository/
│   ├── entities/               (CredentialEntity, UserEntity, StudentEntity, TeacherEntity)
│   ├── jpa/                    (interfețe JpaRepository)
│   └── *Dao.java               (implementări DAO cu toEntity() / toDomain())
├── service/
│   ├── AuthService.java
│   ├── UserService.java
│   ├── JwtService.java
│   └── CustomUserDetailsService.java
├── controller/
│   ├── AuthController.java
│   └── UserController.java
└── config/
    └── SecurityConfig.java     (anyRequest().permitAll() — autorizarea e în API Gateway)
```