# User Service - Chinese Learning Platform

Microserviciu pentru gestionare utilizatori, autentificare JWT si operatii specifice studentilor/profesorilor.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA)
* **Spring Security 6** + JWT
* **Maven** + **SpringDoc OpenAPI**

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + manual DTO mapping
controller/   -> REST endpoints + Swagger docs
config/       -> Spring Security setup
```

**Reguli Implementare (AI Context):**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod
- JWT generation only (validare in API Gateway viitor)
- Spring Boot 4.0.0 API (AuthenticationManagerBuilder pattern)

## Schema Baza de Date

**Database:** `user_database` (postgres/kuso)  
**Port:** 8082  
**Swagger:** http://localhost:8082/swagger-ui/index.html

### Tabele si Relatii (@MapsId strategy):
```
credentials (PK: id, auto-inc)
├── id, email (UNIQUE), password_hash, role, created_at
└── 1:1 -> users

users (PK: id via @MapsId from credentials)
├── id, full_name
├── 1:1 -> students (optional)
└── 1:1 -> teachers (optional)

students (PK: user_id via @MapsId from users)
└── user_id, xp_total (default 0), level (default 1)

teachers (PK: user_id via @MapsId from users)
└── user_id, title (nullable)
```

**ID Sharing:** `credentials.id = users.id = students.user_id` (acelasi ID in toate tabelele)

**Cascade:** `Credential -> User -> Student/Teacher` (CascadeType.ALL)  
**Fetch:** LAZY pe toate relatiile (optimizare N+1 queries)

**Roluri:** STUDENT, TEACHER, ADMIN (ADMIN fara entitate separata)

## Autentificare JWT

### Register Flow:
```
POST /api/auth/register {"email", "password", "fullName", "role"}
-> Valideaza email (unique) si rol (STUDENT/TEACHER/ADMIN)
-> Creeaza Credential (BCrypt hash) + User + Student/Teacher (daca != ADMIN)
-> Salveaza prin cascade
-> Genereaza JWT cu payload: {userId, role, email}
-> Response: {token, userId, role, fullName}
```

### Login Flow:
```
POST /api/auth/login {"email", "password"}
-> AuthenticationManager valideaza (Spring Security + CustomUserDetailsService)
-> Genereaza JWT
-> Response: {token, userId, role, fullName}
```

**JWT Structure:**
```json
{
  "sub": "email@example.com",
  "userId": 1,
  "role": "STUDENT",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Security Config:**
- CSRF disabled (REST stateless)
- `/api/auth/**` + `/swagger-ui/**` public
- `anyRequest().permitAll()` (simplificare licenta - fara JWT filter)
- Session STATELESS

## API Endpoints

### Authentication (`/api/auth`)
```
POST /register  -> Inregistrare publica (STUDENT/TEACHER/ADMIN)
POST /login     -> Autentificare
```

### User Management (`/api/users`)
```
POST   /                           -> Creare user (STUDENT/TEACHER only, admin use)
GET    /                           -> Lista toti userii
GET    /{id}                       -> Detalii user
GET    /search?name=fragment       -> Cautare dupa nume
PUT    /{id}/name?newName=...      -> Update nume
DELETE /{id}                       -> Stergere (cascade)

GET    /students/{userId}          -> Info student
PUT    /students/{userId}/xp?xpToAdd=100     -> Adauga XP (recalculeaza level: XP/1000 + 1)
PUT    /students/{userId}/level?newLevel=5   -> Set level manual (admin)
GET    /students/leaderboard       -> Top 10 studenti dupa XP

GET    /teachers/{userId}          -> Info profesor
PUT    /teachers/{userId}/title?newTitle=PhD -> Update titlu
```

## Logica Business

**Level Calculation:** `level = (xpTotal / 1000) + 1`  
**DTO Mapping:** Manual in Service layer prin metode private `mapToUserDto()`, `mapToStudentDto()`, `mapToTeacherDto()`  
**Exception Handling:** `IllegalArgumentException` prinse in Controller

## Servicii

**AuthService:**
- `register(RegisterRequestDto)` -> AuthResponseDto (cu JWT)
- `login(AuthRequestDto)` -> AuthResponseDto

**UserService:**
- `createUser(RegisterRequestDto)` -> UserDto (fara JWT, admin use)
- CRUD: getAllUsers, getUserById, searchUsersByName, updateUserName, deleteUser
- Student ops: getStudentById, updateStudentXp, updateStudentLevel, getTopStudentsByXp
- Teacher ops: getTeacherById, updateTeacherTitle

**CustomUserDetailsService:**
- Implementeaza `UserDetailsService` pentru Spring Security
- `loadUserByUsername(email)` -> incarca Credential din DB

**JwtService:**
- `generateToken(Map<extraClaims>, UserDetails)` -> String
- `extractUsername(token)`, `isTokenValid(token, UserDetails)`

## Configurare

**application.properties:**
```properties
server.port=8082
spring.datasource.url=jdbc:postgresql://localhost:5432/user_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.jpa.hibernate.ddl-auto=update

application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
application.security.jwt.expiration=86400000
```

**Setup DB:**
```sql
CREATE DATABASE user_database;
```

**Rulare:**
```bash
mvn spring-boot:run
# Sau: Run UserServiceApplication in IntelliJ
```

## Integrare Cross-Service

**Foreign Keys Logice** (nu fizice - Database per Service pattern):
- Progress Service: `student_id` -> users.id
- Group Service: `student_id`, `teacher_id` -> users.id
- Flashcard/TextAnalysis/ConversationalAI: `student_id` -> users.id

**Auth Flow:**
1. Client login -> primeste JWT
2. Client trimite JWT in header: `Authorization: Bearer <token>`
3. API Gateway (viitor) valideaza JWT si extrage userId/role
4. Gateway forwardeaza request cu userId la serviciul destinatie

## Decizii Arhitecturale (AI Context)

**@MapsId Strategy:** Un singur ID partajat intre credentials/users/students/teachers - simplifica JOIN-uri, consistenta.

**Cascade Operations:** Un singur `save(credential)` salveaza tot graful de entitati.

**LAZY Fetch:** Date incarcate doar la acces explicit - previne N+1 queries.

**JWT fara Filter:** User Service genereaza token-uri, API Gateway le valideaza - evita duplicare cod.

**Manual Mapping:** Control complet, usor de extins pentru DTO-uri complexe.

**Spring Boot 4.0.0:** `AuthenticationManager` se configureaza prin `AuthenticationManagerBuilder` din `HttpSecurity`.

## Test Scenarios (Swagger)

1. **Register + Login:** Creeaza STUDENT -> verifica token -> login -> verifica token diferit
2. **XP Calculation:** Add 500 XP (level=1) -> add 600 XP (level=2, total 1100)
3. **Leaderboard:** Register 3 studenti -> verifica ordonare dupa XP
4. **CRUD:** Get all -> search -> update name -> delete (cascade)
5. **Admin Register:** Register cu `role: "ADMIN"` -> verifica fara Student/Teacher entity

---

**Context AI:** README conceput pentru LLM assistance (debugging, extensii, integrare). Toate deciziile arhitecturale sunt justificate pentru intelegere rapida.