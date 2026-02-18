# User Service - Chinese Learning Platform

Microservice pentru Identity & Authentication Management in arhitectura distribuita. Gestioneaza inregistrare utilizatori, autentificare JWT si profiluri studenți/profesori.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA)
* **Spring Security 6** + JWT
* **Maven** + **SpringDoc OpenAPI**
* **Docker** + Amazon Corretto 21

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + manual DTO mapping
controller/   -> REST endpoints + Swagger docs
config/       -> Spring Security setup
```

**Reguli Implementare:**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod si comentarii (encoding safety)
- Comentarii DOAR cu // (INTERZIS /* ... */)
- JWT generation only (validare in API Gateway viitor)
- Controllers NU importa DAO (separation of concerns strict)

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
└── user_id, nickname (optional display name)

teachers (PK: user_id via @MapsId from users)
└── user_id, title (nullable)
```

**ID Sharing Strategy:**
- `credentials.id = users.id = students.user_id` (acelasi ID propagat prin toate tabelele)
- Beneficiu: Un singur ID pentru intreg user graph, simplifica foreign keys
- Pattern: `@MapsId` pe User.id si Student/Teacher.userId

**Cascade:** `Credential -> User -> Student/Teacher` (CascadeType.ALL)  
**Fetch:** LAZY pe toate relatiile (optimizare N+1 queries)

**Roluri:** STUDENT, TEACHER, ADMIN (ADMIN fara entitate separata)

## Bounded Context (Domain-Driven Design)

**User Service = Identity & Authentication Domain**

### Responsibilities:
- User registration cu role selection (STUDENT/TEACHER/ADMIN)
- JWT authentication (login/register)
- User profile CRUD operations (full_name, email)
- Student nickname management (optional display name pentru gamification)
- Teacher title management (academic credentials)

### Out of Scope:
User Service NU gestioneaza:
- Progress tracking (exercise attempts, lesson completion)
- XP/level management (calculat in Progress Service)
- Leaderboard queries (data stored in Progress Service)

## Autentificare JWT

### Register Flow:
```
POST /api/auth/register {"email", "password", "fullName", "role"}
1. Valideaza email (unique constraint) si rol (STUDENT/TEACHER/ADMIN)
2. Creeaza Credential cu BCrypt password hash
3. Creeaza User (cascade save)
4. Daca role == STUDENT -> creeaza Student entity (nickname=NULL)
5. Daca role == TEACHER -> creeaza Teacher entity (title="")
6. Salveaza prin cascade (1 save operation)
7. Genereaza JWT cu payload: {userId, role, email}
8. Response: {token, userId, role, fullName}
```

### Login Flow:
```
POST /api/auth/login {"email", "password"}
1. AuthenticationManager valideaza credentials (Spring Security)
2. CustomUserDetailsService incarca user din DB
3. Genereaza JWT nou
4. Response: {token, userId, role, fullName}
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
- `/api/auth/**` + `/swagger-ui/**` public (permitAll)
- `anyRequest().permitAll()` (simplificare licenta - fara JWT filter validation)
- Session STATELESS (no server-side session)
- **NOTE:** JWT validation va fi implementata in API Gateway (centralizat)

## API Endpoints

Toate rutele incep cu `/api/users`.

### Authentication (`/api/auth`)
```
POST /register  -> Inregistrare publica (STUDENT/TEACHER/ADMIN)
POST /login     -> Autentificare (generare JWT)
```

### User Management (`/api/users`)
```
POST   /                           -> Creare user (admin use)
GET    /                           -> Lista toti userii
GET    /{id}                       -> Detalii user (USED BY PROGRESS SERVICE)
GET    /search?name=fragment       -> Cautare dupa nume (LIKE query)
PUT    /{id}/name?newName=...      -> Update nume
DELETE /{id}                       -> Stergere (cascade)

GET    /students/{userId}          -> Info student (nickname)
PUT    /students/{userId}/nickname?newNickname=...  -> Update nickname

GET    /teachers/{userId}          -> Info profesor
PUT    /teachers/{userId}/title?newTitle=...  -> Update titlu
```

## Entities si DTOs

### Entities (JPA):

**Credential:**
```java
@Entity
@Table(name = "credentials")
public class Credential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;
    
    @Column(nullable = false, length = 20)
    private String role;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @OneToOne(mappedBy = "credential", cascade = CascadeType.ALL)
    private User user;
}
```

**User:**
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    private Long id;
    
    @Column(name = "full_name", nullable = false)
    private String fullName;
    
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private Credential credential;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Student student;
    
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    private Teacher teacher;
}
```

**Student:**
```java
@Entity
@Table(name = "students")
public class Student {
    @Id
    private Long userId;
    
    @Column(name = "nickname", length = 50)
    private String nickname;  // Optional display name
    
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
}
```

**Teacher:**
```java
@Entity
@Table(name = "teachers")
public class Teacher {
    @Id
    private Long userId;
    
    @Column(length = 255)
    private String title;  // e.g., "PhD", "Professor"
    
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;
}
```

### DTOs (Transfer Objects):

**UserDto:**
```java
public class UserDto {
    private Long id;
    private String fullName;
    private String role;  // STUDENT, TEACHER, ADMIN
}
```

**StudentDto:**
```java
public class StudentDto {
    private Long userId;
    private String nickname;  // Optional display name
}
```

**TeacherDto:**
```java
public class TeacherDto {
    private Long userId;
    private String title;
}
```

**RegisterRequestDto:**
```java
public class RegisterRequestDto {
    private String email;
    private String password;
    private String fullName;
    private String role;  // STUDENT, TEACHER, ADMIN
}
```

**AuthResponseDto:**
```java
public class AuthResponseDto {
    private String token;
    private Long userId;
    private String role;
    private String fullName;
}
```

## Service Layer Logic

### AuthService:
```java
@Transactional
AuthResponseDto register(RegisterRequestDto request)
  1. Validate email unique
  2. Validate role (STUDENT/TEACHER/ADMIN)
  3. Create Credential + User + Student/Teacher (cascade)
  4. Generate JWT
  5. Return AuthResponseDto

AuthResponseDto login(AuthRequestDto request)
  1. Authenticate via Spring Security
  2. Generate new JWT
  3. Return AuthResponseDto
```

### UserService:
```java
@Transactional
UserDto createUser(RegisterRequestDto request)
  - Similar to register() but NO JWT generation (admin use)

CRUD Operations:
  - getAllUsers() - fetch all
  - getUserById(Long id) - fetch one (CRITICAL: used by Progress Service)
  - searchUsersByName(String fragment) - LIKE query
  - updateUserName(Long id, String newName)
  - deleteUser(Long id) - cascade delete

Student Operations:
  - getStudentById(Long userId) - StudentDto
  - updateStudentNickname(Long userId, String newNickname)

Teacher Operations:
  - getTeacherById(Long userId) - TeacherDto
  - updateTeacherTitle(Long userId, String title)
```

### CustomUserDetailsService:
```java
UserDetails loadUserByUsername(String email)
  - Implements Spring Security UserDetailsService
  - Loads Credential from DB by email
  - Returns UserDetails for authentication
```

### JwtService:
```java
String generateToken(Map<String, Object> extraClaims, UserDetails userDetails)
  - Creates JWT with custom claims (userId, role)
  - Signs with HMAC secret key
  - Sets expiration (24 hours default)

String extractUsername(String token)
boolean isTokenValid(String token, UserDetails userDetails)
  - Utility methods for token parsing/validation
  - NOT used in User Service (API Gateway responsibility)
```

## Integration cu Alte Servicii

### Progress Service Dependencies:

**Endpoint consumat:** `GET /api/users/{id}`

**Usage:** Lazy student replica creation

**Flow:**
```
1. Student submits first attempt -> Progress Service
2. Progress Service checks: EXISTS student_id in students_replica?
3. If NO -> Call User Service: GET /api/users/{id}
4. Validate student exists + role=STUDENT
5. Create minimal replica in Progress Service (xpTotal=0, level=1)
```

**Response Structure:**
```json
{
  "id": 1,
  "fullName": "John Doe",
  "role": "STUDENT"
}
```

**Error Handling:**
- User not found -> 404 Not Found
- User is not STUDENT -> Progress Service throws validation error

**Integration Pattern:** On-demand REST API call (synchronous)

### Future Service Dependencies:

**Group Service:**
- GET /api/users/students/{userId} - validate student exists
- GET /api/users/teachers/{userId} - validate teacher exists

**Frontend:**
- POST /api/auth/login - authentication
- GET /api/users/students/{userId} - display student nickname
- Leaderboard display: Progress Service returns studentId + XP, Frontend fetches nickname from User Service

## Decizii Arhitecturale

### @MapsId Strategy:
**Decision:** Un singur ID partajat intre credentials/users/students/teachers

**Justification:**
- Simplifica JOIN queries (nu trebuie multiple FK traversals)
- Consistenta: user graph always has same ID
- Evita orphan records (cascade delete garanteaza cleanup)

**Trade-off:** Credentials table leaked implementation detail (user_id = credential_id)

**Implementation:**
```java
@Entity
@Table(name = "students")
public class Student {
    @Id
    private Long userId;  // NOT auto-increment
    
    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
```

### Cascade Operations:
**Decision:** CascadeType.ALL de la Credential -> User -> Student/Teacher

**Justification:**
- Un singur `save(credential)` salveaza tot graful
- Delete user -> sterge automat credentials, student/teacher data
- Simplifica transaction management

**Trade-off:** Cannot partially delete (ex: keep user, delete student) - all-or-nothing

### LAZY Fetch:
**Decision:** FetchType.LAZY pe toate relatiile @OneToOne/@ManyToOne

**Justification:**
- Previne N+1 queries (load 100 users NU incarca automat 100 students)
- Date incarcate doar la acces explicit: `user.getStudent()`

**Requirement:** @Transactional pe Service methods pentru Hibernate session active

### JWT fara Validation Filter:
**Decision:** User Service genereaza JWT, dar NU valideaza in requests

**Justification:**
- API Gateway (viitor) va valida centralizat
- Evita duplicare cod in fiecare microservice
- User Service = Authentication Authority, Gateway = Authorization Enforcer

**Current State:** `anyRequest().permitAll()` - NO PROTECTION (temporary pentru licenta)

### Manual DTO Mapping:
**Decision:** No Lombok, no MapStruct - manual getters/setters/mapping

**Justification:**
- Control complet asupra structurii DTO
- Debugging mai usor (no generated code)
- Evita lazy loading exceptions (extract doar ID-uri pentru FK)

**Pattern:**
```java
private UserDto mapToUserDto(User user) {
    return new UserDto(
        user.getId(),
        user.getFullName(),
        user.getCredential().getRole()  // Access parent OK (already loaded)
    );
}
```

### Nickname Field:
**Decision:** Students table contine doar userId + nickname (optional)

**Purpose:**
- Optional display name pentru gamification (e.g., "DragonSlayer123")
- Alternative la afisare full_name in leaderboard
- Social feature enabler (viitor)

**Default:** NULL la inregistrare, poate fi setat mai tarziu prin endpoint dedicat

**Usage Pattern:**
```
Register student -> nickname=NULL
Later: PUT /students/{id}/nickname?newNickname=DragonSlayer
Leaderboard: Progress Service returneaza studentId + XP
Frontend: Fetch nickname din User Service pentru display
```

## Configurare

### application.properties (Local):
```properties
server.port=8082

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/user_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Security Logging
logging.level.org.springframework.security=INFO

# JWT
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
application.security.jwt.expiration=86400000
```

### Docker Environment Variables (override local):
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://user-database:5432/user_database
  SPRING_DATASOURCE_USERNAME: postgres
  SPRING_DATASOURCE_PASSWORD: kuso
  SPRING_JPA_HIBERNATE_DDL_AUTO: update
  SPRING_JPA_SHOW_SQL: "true"
```

### Setup DB Local:
```sql
CREATE DATABASE user_database;
```

### Rulare Local:
```bash
mvn spring-boot:run
```

### Rulare Docker:
```bash
docker-compose up --build user-service
```

## Test Scenarios (Swagger)

### 1. Register + Login Flow:
```
POST /api/auth/register {email, password, fullName, role: "STUDENT"}
  -> Verify: response contains JWT token
  -> Verify: studentId present

POST /api/auth/login {email, password}
  -> Verify: new JWT token (different from register)
  -> Verify: userId matches registered user
```

### 2. CRUD Operations:
```
GET /api/users
  -> List all users
GET /api/users/search?name=John
  -> Search by name fragment
PUT /api/users/1/name?newName=John Updated
  -> Update name
DELETE /api/users/1
  -> Cascade delete
```

### 3. Student Nickname:
```
POST /api/auth/register {role: "STUDENT"}
  -> Verify: nickname=NULL in database

PUT /api/users/students/1/nickname?newNickname=DragonSlayer
  -> Verify: nickname updated

GET /api/users/students/1
  -> Verify: {userId: 1, nickname: "DragonSlayer"}
```

### 4. Admin vs Student Registration:
```
POST /api/auth/register {role: "ADMIN"}
  -> Verify: NO Student entity created

POST /api/auth/register {role: "STUDENT"}
  -> Verify: Student entity created (nickname=NULL)
```

### 5. Integration Test cu Progress Service:
```
1. Register student in User Service (userId=42)
2. Progress Service: Submit first attempt
3. Progress Service calls: GET /api/users/42
4. Verify: User Service returns valid student data
5. Progress Service: Creates student replica
```

## Known Limitations

**Current Implementation:**
- No email verification flow (email assumed valid)
- No password reset functionality
- No rate limiting pe register/login (vulnerable to brute force)
- No audit trail (cine a modificat ce si cand)
- No password complexity requirements

**Security Gaps (acceptable pentru licenta, NU production):**
- `anyRequest().permitAll()` - no authentication required
- Passwords stored cu BCrypt dar no complexity requirements
- JWT secret in plaintext in properties (ar trebui externalizat)
- No refresh token mechanism (JWT expira dupa 24h, re-login required)

**Future Enhancements:**
- Add email verification cu confirmation token
- Add password reset flow
- Add refresh token support
- Add rate limiting (Spring Cloud Gateway)
- Add audit logging (created_by, updated_by, timestamps)
- Add password complexity validation
- Add externalized secrets management (Vault, K8s Secrets)

## Docker Configuration

**Dockerfile:** Multi-stage build cu Amazon Corretto 21 Alpine

**Dependencies:**
- user-database (PostgreSQL 16)
- Network: chinese-learning-network

**Ports:**
- Internal: 8082
- External: 8082

**Health Check:** Depends on user-database healthy

**Startup Order:**
1. PostgreSQL starts + healthcheck passes
2. User Service starts

## AI Agent Quick Reference

**Service Identity:**
- Name: User Service
- Domain: Identity & Authentication
- Database: user_database
- Port: 8082
- Tech Stack: Java 21, Spring Boot 4, PostgreSQL 16

**Core Responsibilities:**
- User registration (STUDENT/TEACHER/ADMIN roles)
- JWT authentication
- User profile CRUD (full_name, email, nickname)
- Student/Teacher entity management

**Key Integration Points:**
- Exposes: GET /api/users/{id} for Progress Service
- Pattern: On-demand REST API (synchronous)
- No event publishing (no RabbitMQ)

**Database Schema:**
- credentials (id PK, email UNIQUE, password_hash, role, created_at)
- users (id PK via @MapsId, full_name)
- students (user_id PK via @MapsId, nickname)
- teachers (user_id PK via @MapsId, title)

**Critical Implementation Details:**
- @MapsId strategy: credentials.id = users.id = students.user_id
- Cascade: ALL operations propagate down entity graph
- Fetch: LAZY on all relationships
- Security: permitAll() for thesis (JWT validation in Gateway)

**NOT Managed Here:**
- XP/level tracking -> Progress Service
- Exercise attempts -> Progress Service
- Lesson progress -> Progress Service
- Leaderboard data -> Progress Service

**Typical Usage by AI Agent:**
When implementing new features:
1. Check if feature is Identity-related -> User Service
2. Check if feature is Progress-related -> Progress Service
3. Integration: Use REST API GET /users/{id} for validation
4. No cross-service data duplication (Single Source of Truth)