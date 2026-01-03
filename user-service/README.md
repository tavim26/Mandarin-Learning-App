# User Service - Chinese Learning Platform

Microserviciu pentru gestionare utilizatori, autentificare JWT, operatii specifice studentilor/profesorilor si publicare evenimente RabbitMQ pentru sincronizare cross-service.

## Stack Tehnologic

* **Java 21** + **Spring Boot 4.0.0**
* **PostgreSQL 16+** (Hibernate 6 JPA)
* **Spring Security 6** + JWT
* **RabbitMQ** (AMQP) pentru event publishing
* **Maven** + **SpringDoc OpenAPI**
* **Docker** + Amazon Corretto 21

## Arhitectura

**N-Tier Architecture** cu separare clara:
```
domain/       -> Entities (JPA) + DTOs + DAOs (JpaRepository)
service/      -> Business logic + manual DTO mapping + event publishing
controller/   -> REST endpoints + Swagger docs
config/       -> Spring Security setup + RabbitMQ configuration
events/       -> Event DTOs (StudentCreatedEvent, etc.)
```

**Reguli Implementare (AI Context):**
- Fara Lombok, MapStruct (getters/setters/mapping manual)
- Fara diacritice in cod si comentarii (encoding safety)
- Comentarii DOAR cu // (INTERZIS /* ... */)
- JWT generation only (validare in API Gateway viitor)
- Spring Boot 4.0.0 API (AuthenticationManagerBuilder pattern)
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
└── user_id, xp_total (default 0), level (default 1)

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

## Autentificare JWT

### Register Flow:
```
POST /api/auth/register {"email", "password", "fullName", "role"}
1. Valideaza email (unique constraint) si rol (STUDENT/TEACHER/ADMIN)
2. Creeaza Credential cu BCrypt password hash
3. Creeaza User (cascade save)
4. Daca role == STUDENT → creeaza Student entity (xpTotal=0, level=1)
5. Daca role == TEACHER → creeaza Teacher entity
6. Salveaza prin cascade (1 save operation)
7. Publish StudentCreatedEvent la RabbitMQ (daca STUDENT)
8. Genereaza JWT cu payload: {userId, role, email}
9. Response: {token, userId, role, fullName}
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

## RabbitMQ Event-Driven Architecture

### Events Published:

User Service actioneaza ca **Event Publisher** pentru sincronizare student identity data.

**StudentCreatedEvent:**
```java
{
  "studentId": 1,
  "fullName": "John Doe",
  "email": "john@example.com"
}
```
**Trigger:** POST /api/auth/register cu role=STUDENT SAU POST /api/users cu role=STUDENT

---

**StudentUpdatedEvent:**
```java
{
  "studentId": 1,
  "fullName": "John Updated",
  "email": "john.updated@example.com"
}
```
**Trigger:** PUT /api/users/{id}/name (daca user este STUDENT)

---

**StudentDeletedEvent:**
```java
{
  "studentId": 1
}
```
**Trigger:** DELETE /api/users/{id} (daca user este STUDENT)

---

### RabbitMQ Configuration:

**Exchange:** `user.events.exchange` (TopicExchange)

**Routing Keys:**
- `student.created` → StudentCreatedEvent
- `student.updated` → StudentUpdatedEvent
- `student.deleted` → StudentDeletedEvent

**Message Format:** JSON (Jackson2JsonMessageConverter)

**Publisher:** `StudentEventPublisher` service wraps RabbitTemplate

**Error Handling:**
- Events publicate DUPA database commit (success)
- Failure la publish → logged but NOT rolled back (eventual consistency)
- Consumers handle idempotency (duplicate events possible)

### Integration Pattern:

**Eventual Consistency pentru Student Identity:**
- User Service = Source of Truth pentru student data
- Progress Service = Replica consumata via events
- Motivație: Student data rarely changes, eventual consistency acceptable
- Alternative rejected: Synchronous API calls → tight coupling, cascading failures

## API Endpoints

### Authentication (`/api/auth`)
```
POST /register  -> Inregistrare publica (STUDENT/TEACHER/ADMIN)
                   Publică StudentCreatedEvent daca role=STUDENT
POST /login     -> Autentificare (generare JWT)
```

### User Management (`/api/users`)
```
POST   /                           -> Creare user (STUDENT/TEACHER only, admin use)
                                      Publică StudentCreatedEvent daca STUDENT
GET    /                           -> Lista toti userii
GET    /{id}                       -> Detalii user
GET    /search?name=fragment       -> Cautare dupa nume (LIKE query)
PUT    /{id}/name?newName=...      -> Update nume
                                      Publică StudentUpdatedEvent daca STUDENT
DELETE /{id}                       -> Stergere (cascade)
                                      Publică StudentDeletedEvent daca STUDENT

GET    /students/{userId}          -> Info student (xpTotal, level)
PUT    /students/{userId}/xp?xpToAdd=100     -> Adauga XP (USED BY PROGRESS SERVICE!)
                                                Recalculeaza level: (xpTotal / 1000) + 1
PUT    /students/{userId}/level?newLevel=5   -> Set level manual (admin)
GET    /students/leaderboard       -> Top 10 studenti dupa xpTotal

GET    /teachers/{userId}          -> Info profesor
PUT    /teachers/{userId}/title?newTitle=PhD -> Update titlu
```

## Logica Business

### Level Calculation:
```java
level = (xpTotal / 1000) + 1

Exemple:
xpTotal = 0     → level = 1
xpTotal = 500   → level = 1
xpTotal = 1000  → level = 2
xpTotal = 2500  → level = 3
```

**Automatic Recalculation:** Level recalculat automat la fiecare `updateStudentXp()` call.

### DTO Mapping:
Manual in Service layer prin metode private:
- `mapToUserDto()` - Credential + User data
- `mapToStudentDto()` - Student data only (xpTotal, level)
- `mapToTeacherDto()` - Teacher data only (title)

**Pattern:** Extract doar ID-uri pentru FK, nu obiecte intregi (evita lazy loading issues).

### Exception Handling:
- Throw `IllegalArgumentException` pentru validation errors
- Controller catch si returneaza appropriate HTTP status
- No @ControllerAdvice (simplificare licenta)

## Servicii

### AuthService:
```java
AuthResponseDto register(RegisterRequestDto dto)
  1. Validate email unique
  2. Create Credential + User + Student/Teacher (cascade)
  3. Publish StudentCreatedEvent (if STUDENT)
  4. Generate JWT
  5. Return AuthResponseDto

AuthResponseDto login(AuthRequestDto dto)
  1. Authenticate via Spring Security
  2. Generate new JWT
  3. Return AuthResponseDto
```

### UserService:
```java
UserDto createUser(RegisterRequestDto dto)
  - Similar to register() but NO JWT generation (admin use)
  - Publish StudentCreatedEvent if role=STUDENT

CRUD Operations:
  - getAllUsers() - fetch all
  - getUserById(Long id) - fetch one
  - searchUsersByName(String fragment) - LIKE query
  - updateUserName(Long id, String newName) - Publish StudentUpdatedEvent if STUDENT
  - deleteUser(Long id) - Publish StudentDeletedEvent BEFORE deletion if STUDENT

Student Operations:
  - getStudentById(Long userId) - StudentDto
  - updateStudentXp(Long userId, int xpToAdd) - CRITICAL: called by Progress Service!
  - updateStudentLevel(Long userId, int newLevel) - admin override
  - getTopStudentsByXp() - leaderboard (top 10)

Teacher Operations:
  - getTeacherById(Long userId) - TeacherDto
  - updateTeacherTitle(Long userId, String title)
```

### StudentEventPublisher:
```java
void publishStudentCreated(StudentCreatedEvent event)
void publishStudentUpdated(StudentUpdatedEvent event)
void publishStudentDeleted(StudentDeletedEvent event)

Implementation:
  - Wraps RabbitTemplate
  - Uses convertAndSend(exchange, routingKey, event)
  - Logs success/failure
  - Non-blocking (fire-and-forget pattern)
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

## Configurare

### application.properties (Local):
```properties
server.port=8082

# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/user_database
spring.datasource.username=postgres
spring.datasource.password=kuso
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# JWT
application.security.jwt.secret-key=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
application.security.jwt.expiration=86400000

# RabbitMQ
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=guest
spring.rabbitmq.password=guest

# RabbitMQ Routing
rabbitmq.exchange.user-events=user.events.exchange
rabbitmq.routing-key.student-created=student.created
rabbitmq.routing-key.student-updated=student.updated
rabbitmq.routing-key.student-deleted=student.deleted
```

### Docker Environment Variables (override local):
```yaml
environment:
  SPRING_DATASOURCE_URL: jdbc:postgresql://user-database:5432/user_database
  SPRING_DATASOURCE_USERNAME: postgres
  SPRING_DATASOURCE_PASSWORD: kuso
  
  SPRING_RABBITMQ_HOST: rabbitmq
  SPRING_RABBITMQ_PORT: 5672
  SPRING_RABBITMQ_USERNAME: guest
  SPRING_RABBITMQ_PASSWORD: guest
  
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
# Sau: Run UserServiceApplication in IntelliJ
```

### Rulare Docker:
```bash
docker-compose up --build user-service
```

## Integrare Cross-Service

### 1. Progress Service Dependencies:

**PUT /api/users/students/{userId}/xp?xpToAdd={amount}**
- **CRITICAL endpoint** pentru Progress Service
- Apelat cand student completeaza lectie
- Flow: Lesson completed → Progress Service → User Service (add XP)
- Communication: Synchronous REST API call (RestTemplate/Feign)
- Error handling: Progress Service logs failure but continues (XP stored in progress table)

**Example Call:**
```java
// From Progress Service
userServiceClient.addStudentXp(studentId, 100);

// HTTP: PUT http://user-service:8082/api/users/students/1/xp?xpToAdd=100
```

### 2. Progress Service Event Consumption:

**StudentCreatedEvent → Progress Service creates student replica**
- Pattern: Eventual consistency
- Purpose: Progress Service needs student data for foreign keys
- Idempotency: Progress Service checks if student already exists before insert

**StudentUpdatedEvent → Progress Service updates student replica**
- Updates: fullName, email
- Idempotency: Update if exists, ignore if not

**StudentDeletedEvent → Progress Service deletes student replica**
- Cascade: Deletes all progress data for student
- Idempotency: Delete if exists, ignore if not

### 3. Future Service Dependencies:

**Group Service:**
- GET /api/users/students/{userId} - validate student exists
- GET /api/users/teachers/{userId} - validate teacher exists

**Flashcard Service:**
- GET /api/users/students/{userId} - validate student exists

**Frontend:**
- POST /api/auth/login - authentication
- GET /api/users/students/{userId} - display student profile
- GET /api/students/leaderboard - display rankings

### Communication Patterns:

| Integration Point | Pattern | Consistency | Justification |
|------------------|---------|-------------|---------------|
| XP Update | Sync REST API | Strong | Immediate feedback needed |
| Student Identity | Async Events | Eventual | Rare changes, acceptable delay |
| Student Lookup | Sync REST API | Strong | Validation requires immediate response |

## Decizii Arhitecturale (AI Context)

### @MapsId Strategy:
**Decision:** Un singur ID partajat intre credentials/users/students/teachers

**Justification:**
- Simplifica JOIN queries (nu trebuie multiple FK traversals)
- Consistenta: user graph always has same ID
- Evita orphan records (cascade delete garanteaza cleanup)

**Trade-off:** Credentials table leaked implementation detail (user_id = credential_id)

**Alternative rejected:** Separate IDs cu FK relationships → mai complex, no real benefit

---

### Cascade Operations:
**Decision:** CascadeType.ALL de la Credential → User → Student/Teacher

**Justification:**
- Un singur `save(credential)` salveaza tot graful
- Delete user → sterge automat credentials, student/teacher data
- Simplifica transaction management

**Trade-off:** Cannot partially delete (ex: keep user, delete student) - all-or-nothing

---

### LAZY Fetch:
**Decision:** FetchType.LAZY pe toate relatiile @OneToOne/@ManyToOne

**Justification:**
- Previne N+1 queries (load 100 users NU incarca automat 100 students)
- Date incarcate doar la acces explicit: `user.getStudent()`

**Requirement:** @Transactional pe Service methods pentru Hibernate session active

---

### JWT fara Validation Filter:
**Decision:** User Service genereaza JWT, dar NU valideaza in requests

**Justification:**
- API Gateway (viitor) va valida centralizat
- Evita duplicare cod in fiecare microservice
- User Service = Authentication Authority, Gateway = Authorization Enforcer

**Current State:** `anyRequest().permitAll()` - NO PROTECTION (temporary pentru licenta)

---

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

---

### Event Publishing Pattern:
**Decision:** Fire-and-forget event publishing DUPA database commit

**Justification:**
- Eventual consistency acceptable pentru student identity
- Prevents distributed transaction complexity (2PC)
- Consumer handles idempotency (duplicate events possible)

**Trade-off:** Events pot fi pierdute daca RabbitMQ down → acceptable risk

**Alternative rejected:** Transactional Outbox pattern → prea complex pentru licenta

---

### Level Calculation Formula:
**Decision:** `level = (xpTotal / 1000) + 1`

**Justification:**
- Simple, predictable progression
- 1000 XP per level = ~10 lessons per level (assuming 100 XP/lesson)
- Linear scaling (poate fi schimbat la exponential daca needed)

---

### RabbitMQ vs REST for Student Sync:
**Decision:** Events (async) pentru student identity, REST (sync) pentru XP updates

**Justification:**

**Student Identity (events):**
- Changes rare (register, name change, delete)
- No immediate consistency requirement
- Reduces coupling between services

**XP Updates (REST):**
- Frequent operations (every lesson completion)
- Immediate feedback desired (student sees XP increase)
- Strong consistency needed (no partial XP awards)

**Mixed approach = best of both worlds**

## Test Scenarios (Swagger)

### 1. Register + Login Flow:
```
POST /api/auth/register {email, password, fullName, role: "STUDENT"}
  → Verify: response contains JWT token
  → Verify: studentId present
  → Check RabbitMQ: StudentCreatedEvent published

POST /api/auth/login {email, password}
  → Verify: new JWT token (different from register)
  → Verify: userId matches registered user
```

### 2. XP Calculation & Level Up:
```
POST /api/auth/register (creates student with xp=0, level=1)
PUT /api/users/students/1/xp?xpToAdd=500
  → Verify: xpTotal=500, level=1
PUT /api/users/students/1/xp?xpToAdd=600
  → Verify: xpTotal=1100, level=2 (level up!)
```

### 3. Leaderboard:
```
Register 3 students
PUT /students/1/xp?xpToAdd=2000  (level 3)
PUT /students/2/xp?xpToAdd=500   (level 1)
PUT /students/3/xp?xpToAdd=1500  (level 2)

GET /students/leaderboard
  → Verify: Order by xpTotal DESC [student1, student3, student2]
```

### 4. CRUD Operations:
```
GET /api/users
  → List all users
GET /api/users/search?name=John
  → Search by name fragment
PUT /api/users/1/name?newName=John Updated
  → Update name
  → Check RabbitMQ: StudentUpdatedEvent (if STUDENT)
DELETE /api/users/1
  → Cascade delete
  → Check RabbitMQ: StudentDeletedEvent (if STUDENT)
```

### 5. Admin vs Student Registration:
```
POST /api/auth/register {role: "ADMIN"}
  → Verify: NO Student entity created
  → Verify: NO StudentCreatedEvent published

POST /api/auth/register {role: "STUDENT"}
  → Verify: Student entity created (xp=0, level=1)
  → Verify: StudentCreatedEvent published
```

### 6. Event Integration Test:
```
1. Start RabbitMQ Management UI (http://localhost:15672)
2. POST /api/auth/register {role: "STUDENT"}
3. Check Exchanges → user.events.exchange → 1 message out
4. Check Queues → progress.student.created.queue → 1 message delivered
```

## Known Issues & Limitations

**Current Implementation:**
- No JWT validation in User Service (delegat la API Gateway viitor)
- No email verification flow (email assumed valid)
- No password reset functionality
- No rate limiting pe register/login (vulnerable to brute force)
- No audit trail (cine a modificat ce si cand)
- Event publishing failure NU rollback transaction (eventual consistency risk)

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
- Add RabbitMQ retry policy cu Dead Letter Queue
- Add password complexity validation
- Add externalized secrets management (Vault, K8s Secrets)

## Docker Configuration

**Dockerfile:** Multi-stage build cu Amazon Corretto 21 Alpine

**Dependencies:**
- user-database (PostgreSQL 16)
- rabbitmq (RabbitMQ 3 Management)
- Network: chinese-learning-network

**Ports:**
- Internal: 8082
- External: 8082

**Health Check:** Depends on user-database healthy AND rabbitmq healthy

**Startup Order:**
1. PostgreSQL starts + healthcheck passes
2. RabbitMQ starts + healthcheck passes
3. User Service starts (depends_on both)

## RabbitMQ Management

**Access:** http://localhost:15672 (guest/guest)

**Monitoring:**
- Exchanges → `user.events.exchange` → verify message rate
- Queues → `progress.student.*.queue` → verify consumption
- Connections → verify User Service connected

**Debugging Events:**
- Get messages → retrieve event payload
- Purge queue → clear test data
- Dead letter queue → check failed events (future enhancement)

---

**Context AI:** README conceput pentru LLM assistance cu focus pe event-driven integration patterns. Toate deciziile arhitecturale justificate, trade-offs explicati, limitations documentate transparent pentru a ajuta AI sa inteleaga constrangerile si sa sugereze solutii adecvate.