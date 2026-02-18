# User Service - Chinese Learning Platform

Microservice pentru **Identity & Authentication Management**. Gestioneaza user registration, JWT authentication si profiluri studenti/profesori.

## Stack Tehnologic

**Java 21** + **Spring Boot 4.0.0** + **PostgreSQL 16+** + **Spring Security 6** + **JWT** + **Maven** + **Docker**

## Schema Baza de Date

**Database:** `user_database` | **Port:** 8082

```dbml
Table "credentials" {
  "id" BIGINT [pk, increment]
  "email" VARCHAR(255) [unique, not null]
  "password_hash" VARCHAR(255) [not null]
  "role" VARCHAR(20) [not null]
  "created_at" TIMESTAMP [not null]
}

Table "users" {
  "id" BIGINT [pk]
  "full_name" VARCHAR(255) [not null]
}

Table "students" {
  "user_id" BIGINT [pk]
  "nickname" VARCHAR(50)
}

Table "teachers" {
  "user_id" BIGINT [pk]
  "title" VARCHAR(255)
}

Ref: "users"."id" - "credentials"."id"
Ref: "students"."user_id" - "users"."id"
Ref: "teachers"."user_id" - "users"."id"
```

**Key Points:**
- **@MapsId Strategy:** `credentials.id = users.id = students.user_id` (same ID propagated)
- **Cascade:** Credential → User → Student/Teacher (CascadeType.ALL)
- **Fetch:** LAZY on all relationships
- **Roles:** STUDENT, TEACHER, ADMIN

## Bounded Context

**Domain:** Identity & Authentication

**Owns:**
- User registration (role selection: STUDENT/TEACHER/ADMIN)
- JWT authentication (login/register)
- User profile CRUD (full_name, email)
- Student nickname management (optional display name)
- Teacher title management (academic credentials)

**Does NOT Own:**
- Progress tracking (exercise attempts, lesson completion in Progress Service)
- XP/level management (calculated in Progress Service)
- Leaderboard queries (data in Progress Service)

## JWT Authentication

**Register Flow:**
```
POST /api/auth/register {email, password, fullName, role}
1. Validate email unique + role (STUDENT/TEACHER/ADMIN)
2. Create Credential (BCrypt password hash)
3. Create User (cascade)
4. IF role=STUDENT -> Create Student entity (nickname=NULL)
5. IF role=TEACHER -> Create Teacher entity (title="")
6. Save (cascade saves all)
7. Generate JWT {userId, role, email}
8. Return {token, userId, role, fullName}
```

**Login Flow:**
```
POST /api/auth/login {email, password}
1. AuthenticationManager validates credentials
2. Generate new JWT
3. Return {token, userId, role, fullName}
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

**Security:** JWT validation delegated to API Gateway (User Service only generates)

## API Endpoints

**Base:** `/api/users`

### Authentication
```
POST /api/auth/register  -> Public registration
POST /api/auth/login     -> Authentication
```

### User Management
```
POST   /                          -> Create user (admin)
GET    /                          -> List all users
GET    /{id}                      -> Get user (USED BY PROGRESS SERVICE)
GET    /search?name=fragment      -> Search by name
PUT    /{id}/name?newName=...     -> Update full name
DELETE /{id}                      -> Delete (cascade)
```

### Student Operations
```
GET /students/{userId}                   -> Get student (nickname)
PUT /students/{userId}/nickname?newNickname=...  -> Update nickname
```

### Teacher Operations
```
GET /teachers/{userId}                   -> Get teacher
PUT /teachers/{userId}/title?newTitle=... -> Update title
```

## Service Layer Logic

**AuthService:**
- `register()`: Create Credential → User → Student/Teacher (cascade), generate JWT
- `login()`: Authenticate, generate new JWT

**UserService:**
- `createUser()`: Similar to register, no JWT (admin use)
- `getAllUsers()`, `getUserById()`, `searchUsersByName()`, `updateUserName()`, `deleteUser()`
- `getStudentById()`, `updateStudentNickname()`
- `getTeacherById()`, `updateTeacherTitle()`

## DTOs

**UserDto:**
```java
{id, fullName, role}
```

**StudentDto:**
```java
{userId, nickname}
```

**TeacherDto:**
```java
{userId, title}
```

**RegisterRequestDto:**
```java
{email, password, fullName, role}
```

**AuthResponseDto:**
```java
{token, userId, role, fullName}
```

## Integration cu Alte Servicii

**Progress Service Dependencies:**

**Endpoint:** `GET /api/users/{id}`

**Usage:** Lazy student replica creation
```
Flow:
1. Student submits first attempt -> Progress Service
2. Progress Service: EXISTS student_id in replica? NO
3. Call User Service: GET /api/users/{id}
4. Validate: role=STUDENT
5. Create minimal replica (xpTotal=0, level=1)
```

**Response:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "role": "STUDENT"
}
```

**Error:** 404 if user not found

**Pattern:** On-demand REST API (synchronous)

## Key Architectural Decisions

**1. @MapsId Strategy**
- One shared ID: credentials.id = users.id = students.user_id
- Simplifies JOINs, prevents orphan records
- Cascade delete guarantees cleanup

**2. Cascade Operations**
- CascadeType.ALL: Credential → User → Student/Teacher
- Single `save(credential)` saves entire graph
- Delete user → deletes all related entities

**3. LAZY Fetch**
- FetchType.LAZY on all @OneToOne/@ManyToOne
- Prevents N+1 queries
- Requires @Transactional on Service methods

**4. JWT Generation Only**
- User Service generates JWT, does NOT validate in requests
- API Gateway (future) will validate centrally
- Current: `anyRequest().permitAll()` (thesis simplification)

**5. Manual DTO Mapping**
- No Lombok/MapStruct
- Full control over DTO structure
- Avoids lazy loading exceptions

**6. Nickname Field**
- Students table: user_id + nickname (optional)
- Default: NULL at registration
- Purpose: Display name for gamification (e.g., "DragonSlayer123")
- Usage: Progress Service returns studentId + XP, Frontend fetches nickname from User Service

## Entities (Key Structure)

**Credential:**
```java
@Entity
public class Credential {
    @Id @GeneratedValue
    private Long id;
    @Column(unique = true, nullable = false)
    private String email;
    private String passwordHash;
    private String role;
    private LocalDateTime createdAt;
    @OneToOne(cascade = ALL)
    private User user;
}
```

**Student:**
```java
@Entity
public class Student {
    @Id
    private Long userId;  // NOT auto-increment
    @Column(length = 50)
    private String nickname;
    @MapsId @OneToOne(fetch = LAZY)
    private User user;
}
```

## Configurare

```properties
server.port=8082
spring.datasource.url=jdbc:postgresql://localhost:5432/user_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.jpa.hibernate.ddl-auto=update

# JWT
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
application.security.jwt.expiration=86400000
```

## Example Flows

**Student Registration:**
```
POST /api/auth/register {email, password, fullName, role:"STUDENT"}
-> Create: Credential + User + Student (nickname=NULL)
-> Generate JWT
-> Response: {token, userId:1, role:"STUDENT", fullName}
-> Progress Service: NO action (lazy creation pattern)
```

**Lazy Validation (Progress Service calls):**
```
Progress Service: Submit first attempt
-> Check: EXISTS student_id=1 in replica? NO
-> Call: GET /api/users/1
-> Response: {id:1, fullName:"John", role:"STUDENT"}
-> Create replica in Progress Service
```

**Nickname Update:**
```
PUT /api/users/students/1/nickname?newNickname=DragonSlayer
-> UPDATE students SET nickname='DragonSlayer' WHERE user_id=1
-> Response: {userId:1, nickname:"DragonSlayer"}
-> Progress Service: NO action (nickname stored only in User Service)
-> Frontend: Fetches nickname when displaying leaderboard
```

## Test Scenarios

**Register + Login:**
```
POST /auth/register {role:"STUDENT"}
-> Verify: JWT token, nickname=NULL in DB
POST /auth/login
-> Verify: New JWT token
```

**CRUD:**
```
GET /users -> List all
GET /users/1 -> Get one
PUT /users/1/name?newName=Updated
DELETE /users/1 -> Cascade delete
```

**Nickname:**
```
POST /auth/register {role:"STUDENT"}
-> nickname=NULL
PUT /students/1/nickname?newNickname=Test
GET /students/1
-> {userId:1, nickname:"Test"}
```

**Role Validation:**
```
POST /auth/register {role:"TEACHER"}
-> Teacher entity created, NO Student
POST /auth/register {role:"ADMIN"}
-> NO Student/Teacher entity
```

**Integration:**
```
1. Register student (userId=42)
2. Progress Service: Submit first attempt
3. Progress Service calls: GET /users/42
4. Verify: Valid response
5. Progress Service: Creates replica
```

## Known Limitations

- No email verification flow
- No password reset functionality
- No JWT refresh tokens
- No rate limiting (vulnerable to brute force)
- Security: `anyRequest().permitAll()` (no authentication - thesis only)
- No audit trail (timestamps, created_by)

## AI Agent Quick Reference

**Service Identity:**
- Domain: Identity & Authentication
- Database: user_database, Port: 8082
- Tech: Java 21, Spring Boot 4, PostgreSQL 16, JWT

**Responsibilities:**
- User registration (STUDENT/TEACHER/ADMIN roles)
- JWT authentication (login/register)
- User profile CRUD (full_name, email, nickname)
- Student/Teacher entity management

**Integration:**
- Exposes: GET /api/users/{id} for Progress Service
- Pattern: On-demand REST API (synchronous)
- No event publishing (no RabbitMQ)

**Schema:**
- credentials (id PK, email UNIQUE, password_hash, role, created_at)
- users (id PK via @MapsId, full_name)
- students (user_id PK via @MapsId, nickname)
- teachers (user_id PK via @MapsId, title)

**Critical Details:**
- @MapsId strategy: credentials.id = users.id = students.user_id
- Cascade: ALL operations propagate down
- Fetch: LAZY on all relationships
- Security: permitAll() for thesis (JWT validation in Gateway)

**Data Ownership:**
- Owns: User identity (full_name, email, nickname)
- Does NOT own: XP, level, attempts, progress (Progress Service)

**Typical Usage:**
When implementing features:
1. Identity-related -> User Service
2. Progress-related -> Progress Service
3. Integration: REST API GET /users/{id} for validation
4. No cross-service data duplication (Single Source of Truth)