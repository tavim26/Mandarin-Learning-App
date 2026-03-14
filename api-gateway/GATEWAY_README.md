# api-gateway

Microserviciu responsabil pentru autentificarea JWT, autorizarea pe baza de rol si rutarea request-urilor catre microserviciile din platforma de invatare a limbii chineze mandarine.

- **Port:** `8080`
- **Baza de date:** Nu — stateless, fara persistenta
- **Emite JWT:** Nu — validare exclusiva, emiterea este responsabilitatea `user-service`
- **Toate request-urile** catre microservicii trec obligatoriu prin Gateway

---

## Tech Stack

- Java 21, Spring Boot 4.x, Spring Cloud Gateway (MVC Blocking)
- Spring Security
- JJWT 0.12.6 (validare HS256)

---

## Roluri suportate

| Rol | Descriere |
|---|---|
| `STUDENT` | Acces la propriile resurse + endpoint-uri publice per rol |
| `TEACHER` | Acces la continut educational (read-only) + propriul profil |
| `ADMIN` | Acces complet la toate endpoint-urile |

---

## Fluxul de autentificare

```
Client
  │
  ├── POST /api/auth/login ──────────────────────────────▶ user-service (8082)
  │        (fara JWT)                                        └── returneaza JWT
  │
  └── Orice alt request
       Authorization: Bearer <JWT>
              │
              ▼
        API Gateway (8080)
              │
              ├── Valideaza JWT (HS256, secret partajat cu user-service)
              ├── Extrage userId + role din claims
              ├── Verifica autorizarea pe baza de rol
              ├── Verifica ownership (own) pentru resurse per utilizator
              │
              ├── Injecteaza headere downstream:
              │     X-User-Id: <userId>
              │     X-User-Role: <role>
              │
              └── Proxy catre microserviciul destinatar
```

---

## JWT — structura token

**Algoritm:** HS256
**Secret:** partajat intre `api-gateway` si `user-service`

**Claims payload:**

| Claim | Tip | Descriere |
|---|---|---|
| `sub` | String | email-ul utilizatorului |
| `userId` | Long | ID-ul utilizatorului |
| `role` | String | `STUDENT` / `TEACHER` / `ADMIN` |
| `iat` | Date | emis la |
| `exp` | Date | expira la |

**Utilizare in frontend:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

---

## Headere injectate downstream

Fiecare microserviciu primeste automat aceste headere pe orice request autentificat:

| Header | Tip | Descriere |
|---|---|---|
| `X-User-Id` | `Long` | `userId` din JWT claims |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

> Microserviciile nu valideaza JWT-ul direct — citesc exclusiv aceste headere.

---

## Endpoint-uri publice (fara JWT)

| Method | Path | Destinatie |
|---|---|---|
| `POST` | `/api/auth/register` | user-service (8082) |
| `POST` | `/api/auth/login` | user-service (8082) |

---

## Reguli de autorizare per serviciu

### Regula `own`
Un `STUDENT` poate accesa doar resursele proprii. Gateway-ul verifica ca `{studentId}` / `{userId}` din path coincide cu `userId` din JWT.

Path-urile verificate pentru `own`:
- `/api/flashcards/sets/student/{studentId}`
- `/api/progress/students/{studentId}`
- `/api/progress/lessons/student/{studentId}`
- `/api/progress/attempts/student/{studentId}`
- `/api/analysis/student/{studentId}`
- `/api/users/students/{userId}`
- `/api/users/teachers/{userId}`

---

### user-service — port 8082

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/auth/register | ✓ | | | |
| POST | /api/auth/login | ✓ | | | |
| POST | /api/users | | | | ✓ |
| GET | /api/users | | | | ✓ |
| GET | /api/users/{id} | | | | ✓ |
| GET | /api/users/search | | | | ✓ |
| PUT | /api/users/{id}/name | | | | ✓ |
| DELETE | /api/users/{id} | | | | ✓ |
| GET | /api/users/students/{userId} | | own | | ✓ |
| PUT | /api/users/students/{userId}/nickname | | own | | ✓ |
| GET | /api/users/teachers/{userId} | | | own | ✓ |
| PUT | /api/users/teachers/{userId}/title | | | own | ✓ |

---

### content-service — port 8081

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| GET | /api/content/units | | ✓ | ✓ | ✓ |
| GET | /api/content/units/{id} | | ✓ | ✓ | ✓ |
| POST | /api/content/units | | | | ✓ |
| PUT | /api/content/units/{id} | | | | ✓ |
| DELETE | /api/content/units/{id} | | | | ✓ |
| GET | /api/content/units/{unitId}/lessons | | ✓ | ✓ | ✓ |
| GET | /api/content/lessons/{id} | | ✓ | ✓ | ✓ |
| POST | /api/content/lessons | | | | ✓ |
| PUT | /api/content/lessons/{id} | | | | ✓ |
| DELETE | /api/content/lessons/{id} | | | | ✓ |
| GET | /api/content/lessons/{lessonId}/exercises | | ✓ | ✓ | ✓ |
| GET | /api/content/exercises/{id} | | ✓ | ✓ | ✓ |
| POST | /api/content/exercises | | | | ✓ |
| PUT | /api/content/exercises/{id} | | | | ✓ |
| DELETE | /api/content/exercises/{id} | | | | ✓ |
| GET | /api/content/lessons/{lessonId}/materials | | ✓ | ✓ | ✓ |
| POST | /api/content/materials | | | | ✓ |
| DELETE | /api/content/materials/{id} | | | | ✓ |

---

### progress-service — port 8083

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/progress/attempts | | own | | ✓ |
| GET | /api/progress/attempts/student/{studentId}/exercise/{exerciseId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId}/lesson/{lessonId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId} | | own | | ✓ |
| GET | /api/progress/lessons/student/{studentId}/in-progress | | own | | ✓ |
| GET | /api/progress/lessons/{lessonId}/leaderboard | | ✓ | ✓ | ✓ |
| GET | /api/progress/students/leaderboard | | ✓ | ✓ | ✓ |
| GET | /api/progress/students/{studentId} | | own | | ✓ |
| GET | /api/progress/students/{studentId}/exists | | own | | ✓ |
| GET | /api/progress/students/admin/all | | | | ✓ |

---

### chatbot-service — port 8084

> TEACHER nu are acces la niciun endpoint al acestui serviciu.

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/chatbot/sessions | | own | | ✓ |
| GET | /api/chatbot/sessions | | own | | ✓ |
| PATCH | /api/chatbot/sessions/{sessionId}/end | | own | | ✓ |
| POST | /api/chatbot/sessions/{sessionId}/messages | | own | | ✓ |
| GET | /api/chatbot/sessions/{sessionId}/messages | | own | | ✓ |

---

### text-analysis-service — port 8085 (FastAPI / Python)

> TEACHER nu are acces la niciun endpoint al acestui serviciu.

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/analysis/text | | own | | ✓ |
| POST | /api/analysis/ocr | | own | | ✓ |
| GET | /api/analysis/student/{studentId} | | own | | ✓ |
| GET | /api/analysis/{analysisId} | | own | | ✓ |
| DELETE | /api/analysis/{analysisId} | | own | | ✓ |

---

### flashcard-service — port 8086

> TEACHER nu are acces la niciun endpoint al acestui serviciu.

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|---|---|---|---|---|---|
| POST | /api/flashcards/sets | | own | | ✓ |
| GET | /api/flashcards/sets/student/{studentId} | | own | | ✓ |
| GET | /api/flashcards/sets/{setId} | | own | | ✓ |
| PUT | /api/flashcards/sets/{setId} | | own | | ✓ |
| DELETE | /api/flashcards/sets/{setId} | | own | | ✓ |
| POST | /api/flashcards/cards | | own | | ✓ |
| GET | /api/flashcards/sets/{setId}/cards | | own | | ✓ |
| GET | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| PUT | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| DELETE | /api/flashcards/cards/{flashcardId} | | own | | ✓ |
| POST | /api/flashcards/reviews | | own | | ✓ |
| GET | /api/flashcards/reviews/due/{studentId} | | own | | ✓ |
| GET | /api/flashcards/reviews/history/{studentId}/{flashcardId} | | own | | ✓ |
| GET | /api/flashcards/reviews/progress/{studentId}/{flashcardId} | | own | | ✓ |

---

## Coduri de eroare returnate de Gateway

| Cod | Cauza |
|---|---|
| `401` | Token JWT lipsa, expirat sau corupt |
| `403` | Rol insuficient sau incercare de acces la resursa altui utilizator |

> Erorile `404`, `409`, `503` etc. sunt returnate de microserviciile downstream, nu de Gateway.

---

## Rutare — mapare prefix path catre microserviciu

| Prefix path | Microserviciu | Port |
|---|---|---|
| `/api/auth/**` | user-service | 8082 |
| `/api/users/**` | user-service | 8082 |
| `/api/content/**` | content-service | 8081 |
| `/api/progress/**` | progress-service | 8083 |
| `/api/chatbot/**` | chatbot-service | 8084 |
| `/api/analysis/**` | text-analysis-service | 8085 |
| `/api/flashcards/**` | flashcard-service | 8086 |

---

## Structura pachetelor

```
apigateway/
├── config/
│   └── SecurityConfig.java          # Spring Security — rute publice vs protejate
├── filter/
│   ├── JwtAuthenticationFilter.java # Validare JWT + injectare headere downstream
│   ├── AuthorizationFilter.java     # Verificare rol + ownership (own)
│   └── MutableHttpServletRequest.java
└── util/
    └── JwtUtil.java                 # Parsare si validare token HS256
```