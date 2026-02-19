# user-service

## Responsabilitate
Microserviciu responsabil de gestionarea utilizatorilor platformei de invatare a limbii chineze.
Acopera doua domenii: autentificare (register, login, JWT) si operatii CRUD pe utilizatori, studenti si profesori.

---

## Port
`8082`

---

## Tehnologii
- Java Spring Boot
- Spring Security (stateless, fara sesiuni)
- JWT (jjwt)
- Spring Data JPA / Hibernate
- BCrypt pentru hash parole
- Swagger / OpenAPI (`http://localhost:8082/swagger-ui/index.html`)

---

## Baza de date

**Schema:** `user_service_db` (sau echivalent configurat in `application.yml`)

| Tabel | Cheie primara | Descriere |
|---|---|---|
| `credentials` | `id` (BIGINT, auto-increment) | Date de autentificare |
| `users` | `id` (BIGINT, FK -> credentials.id) | Profil utilizator |
| `students` | `user_id` (BIGINT, FK -> users.id) | Date specifice studentului |
| `teachers` | `user_id` (BIGINT, FK -> users.id) | Date specifice profesorului |

**Relatii:**
- `Credential` este agregatul radacina — genereaza ID-ul
- `User` preia ID-ul din `Credential` via `@MapsId`
- `Student` si `Teacher` preiau ID-ul din `User` via `@MapsId`
- Un utilizator cu rolul `ADMIN` nu are entitate `Student` sau `Teacher`

---

## Roluri
| Rol | Entitate asociata |
|---|---|
| `STUDENT` | `Student` (camp: `nickname`) |
| `TEACHER` | `Teacher` (camp: `title`) |
| `ADMIN` | fara entitate separata |

---

## Securitate
- Autorizarea pe baza de rol **NU** se face in acest serviciu
- Autorizarea este delegata centralizat catre **API Gateway**
- Toate endpoint-urile sunt `permitAll()` la nivel de `SecurityFilterChain`
- Serviciul nu este expus direct, ci doar prin API Gateway

---

## JWT

Token-ul este generat **doar la Login**, nu la Register.

**Claims din payload:**
```json
{
  "sub": "email@example.com",
  "userId": 1,
  "role": "STUDENT",
  "iat": ...,
  "exp": ...
}
```

**Algoritm:** HS256
**Configurare:** `application.security.jwt.secret-key` si `application.security.jwt.expiration` din `application.yml`

---

## Endpoints

### AUTH — `/api/auth`

#### POST `/api/auth/register`
- **Acces:** public
- **Request:**
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
- **Response `400`:** email deja inregistrat sau rol invalid

---

#### POST `/api/auth/login`
- **Acces:** public
- **Request:**
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
- **Response `401`:** credentiale invalide

---

### USERS — `/api/users`

> Toate endpoint-urile de mai jos sunt accesibile doar prin API Gateway cu autorizare corespunzatoare.

#### POST `/api/users`
- **Acces:** doar ADMIN (aplicat in Gateway)
- **Roluri acceptate la creare:** doar `STUDENT` sau `TEACHER` (un admin nu poate crea alt admin)
- **Request:** identic cu `RegisterRequestDto`
- **Response `201`:**
```json
{
  "id": 1,
  "fullName": "string",
  "role": "STUDENT"
}
```

#### GET `/api/users`
- **Response `200`:** lista de `UserDto`

#### GET `/api/users/{id}`
- **Response `200`:** `UserDto`
- **Response `404`:** utilizator inexistent

#### GET `/api/users/search?name={fragment}`
- **Response `200`:** lista de `UserDto` filtrata dupa `fullName`

#### PUT `/api/users/{id}/name?newName={value}`
- **Response `200`:** `UserDto` actualizat

#### DELETE `/api/users/{id}`
- **Response `204`:** stergere cascade (User, Student/Teacher)
- **Response `404`:** utilizator inexistent

---

### STUDENTS — `/api/users/students`

#### GET `/api/users/students/{userId}`
- **Response `200`:**
```json
{
  "userId": 1,
  "nickname": "string | null"
}
```

#### PUT `/api/users/students/{userId}/nickname?newNickname={value}`
- **Response `200`:** `StudentDto` actualizat

---

### TEACHERS — `/api/users/teachers`

#### GET `/api/users/teachers/{userId}`
- **Response `200`:**
```json
{
  "userId": 1,
  "title": "string"
}
```

#### PUT `/api/users/teachers/{userId}/title?newTitle={value}`
- **Response `200`:** `TeacherDto` actualizat

---

## DTO-uri

| DTO | Campuri |
|---|---|
| `RegisterRequestDto` | `email`, `password`, `fullName`, `role` |
| `RegisterResponseDto` | `userId`, `role`, `fullName` |
| `AuthRequestDto` | `email`, `password` |
| `AuthResponseDto` | `token`, `userId`, `role`, `fullName` |
| `UserDto` | `id`, `fullName`, `role` |
| `StudentDto` | `userId`, `nickname` |
| `TeacherDto` | `userId`, `title` |

---

## Structura pachete

```
com.chineselearning.userservice
├── config
│   └── SecurityConfig
├── controller
│   ├── AuthController
│   └── UserController
├── domain
│   ├── dao
│   │   ├── ICredentialDao
│   │   ├── IUserDao
│   │   ├── IStudentDao
│   │   └── ITeacherDao
│   ├── dto
│   │   ├── AuthRequestDto
│   │   ├── AuthResponseDto
│   │   ├── RegisterRequestDto
│   │   ├── RegisterResponseDto
│   │   ├── UserDto
│   │   ├── StudentDto
│   │   └── TeacherDto
│   ├── Credential
│   ├── User
│   ├── Student
│   └── Teacher
└── service
    ├── AuthService
    ├── UserService
    ├── JwtService
    └── CustomUserDetailsService
```

---

## Dependente externe
- Niciun alt microserviciu nu este apelat din user-service
- user-service este apelat de API Gateway pentru validarea token-urilor (viitor)