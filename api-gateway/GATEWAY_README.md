# api-gateway

Microserviciu responsabil pentru autentificarea JWT, autorizarea bazata pe roluri (RBAC) si rutarea request-urilor catre microserviciile downstream ale platformei de invatare a limbii chineze.

- **Port:** `8080`
- **Baza de date:** Nu — stateless, fara persistenta
- **Emite JWT:** Nu — validare exclusiv; emiterea este responsabilitatea `user-service`
- **Swagger UI:** Nu — Gateway-ul nu expune documentatie proprie

---

## Tech Stack

- Java 21, Spring Boot 4.0.3
- Spring Cloud Gateway (MVC Blocking — `spring-cloud-starter-gateway-server-webmvc`)
- Spring Security
- JJWT 0.12.6 (validare HS256)

---

## Rol in arhitectura

API Gateway-ul este singurul punct de intrare in sistem. Niciun microserviciu downstream nu este expus direct. Fluxul unui request este:

```
Client
  └── API Gateway :8080
        ├── JwtAuthenticationFilter   (@Order 1) — valideaza JWT, injecteaza headere
        ├── AuthorizationFilter       (@Order 2) — verifica rolul si ownership-ul
        └── Proxy → microserviciu downstream
```

---

## Rute configurate

| ID ruta | Path prefix | Serviciu destinatie | Port |
|---|---|---|---|
| `user-service` | `/api/auth/**`, `/api/users/**` | user-service | 8082 |
| `content-service` | `/api/content/**` | content-service | 8081 |
| `progress-service` | `/api/progress/**` | progress-service | 8083 |
| `chatbot-service` | `/api/chatbot/**` | chatbot-service | 8084 |
| `analysis-service` | `/api/analysis/**` | text-analysis-service | 8085 |
| `flashcard-service` | `/api/flashcards/**` | flashcard-service | 8086 |

---

## Filtre de securitate

### `JwtAuthenticationFilter` — `@Order(1)`

Responsabilitati:
- Verifica prezenta headerului `Authorization: Bearer <token>`
- Valideaza semnatura si expirarea JWT folosind secretul HS256 partajat cu `user-service`
- Extrage claims-urile `userId` si `role` din payload
- Injecteaza headerele `X-User-Id` si `X-User-Role` in request-ul transmis downstream
- Blocheaza cu `401 Unauthorized` orice request cu token absent, expirat sau corupt

Endpoint-uri excluse (nu necesita JWT):
```
POST /api/auth/register
POST /api/auth/login
```

**Headere injectate downstream:**

| Header | Tip | Sursa |
|---|---|---|
| `X-User-Id` | `Long` | claim `userId` din JWT |
| `X-User-Role` | `String` | claim `role` din JWT (`STUDENT` / `TEACHER` / `ADMIN`) |

> Microserviciile downstream NU valideaza JWT — se bazeaza exclusiv pe aceste headere. Validarea JWT este centralizata exclusiv in Gateway.

---

### `AuthorizationFilter` — `@Order(2)`

Responsabilitati:
- Aplica regulile RBAC pe baza headerului `X-User-Role` injectat de filtrul anterior
- Verifica ownership-ul resurselor (`own`) prin compararea `{userId}` din path cu `X-User-Id`
- Blocheaza cu `403 Forbidden` request-urile care incalca regulile

#### Reguli de autorizare — prioritate de evaluare

Evaluarea se face in ordine. La primul match, decizia este finala.

**1. ADMIN** — acces nerestrictiv la toate endpoint-urile

**2. TEACHER** — blocat complet de la serviciile exclusive pentru studenti:
```
/api/flashcards/**
/api/analysis/**
/api/chatbot/**
```

**3. ADMIN-only routes** — blocate pentru STUDENT si TEACHER:

| Method | Path regex | Descriere |
|---|---|---|
| `POST` | `^/api/users$` | Creare utilizator |
| `GET` | `^/api/users$` | Lista toti utilizatorii |
| `GET` | `^/api/users/\\d+$` | Detaliu utilizator dupa ID |
| `GET` | `^/api/users/search.*$` | Cautare utilizatori dupa nume |
| `PUT` | `^/api/users/\\d+/name.*$` | Modificare nume utilizator |
| `PUT` | `^/api/users/\\d+/password/reset.*$` | Reset parola fara verificare |
| `DELETE` | `^/api/users/\\d+.*$` | Stergere utilizator |
| `GET` | `^/api/users/students$` | Lista completa studenti |
| `GET` | `^/api/users/teachers$` | Lista completa profesori |
| `GET` | `^/api/progress/students/admin/all$` | Toti studentii cu XP |

> Matching-ul se face prin `String.matches()` cu regex precis — nu prin `startsWith` — pentru a evita coliziunile intre rute cu prefix comun (ex: `GET /api/users/students` vs `GET /api/users/students/{id}`).

**4. Verificare ownership (`own`)** — aplicata pentru STUDENT si TEACHER:

Daca path-ul request-ului contine `{userId}` sau `{studentId}`, valoarea este extrasa si comparata cu `X-User-Id`. In caz de nepotrivire → `403 Forbidden`.

| Pattern regex | Camp verificat |
|---|---|
| `^/api/flashcards/sets/student/(\\d+).*$` | `studentId` |
| `^/api/progress/students/(\\d+).*$` | `studentId` |
| `^/api/progress/lessons/student/(\\d+).*$` | `studentId` |
| `^/api/progress/attempts/student/(\\d+).*$` | `studentId` |
| `^/api/progress/units/\\d+/student/(\\d+).*$` | `studentId` (al doilea segment numeric) |
| `^/api/analysis/student/(\\d+).*$` | `studentId` |
| `^/api/users/students/(\\d+).*$` | `userId` |
| `^/api/users/teachers/(\\d+).*$` | `userId` |
| `^/api/users/(\\d+)/email.*$` | `userId` |
| `^/api/users/(\\d+)/password$` | `userId` |

> Endpoint-urile fara `{userId}` in path (ex: `POST /api/chatbot/sessions`, `POST /api/flashcards/reviews`) nu necesita verificare de ownership in Gateway — identitatea este preluata exclusiv din `X-User-Id` header in serviciul downstream.

---

## JWT

- **Algoritm:** HS256
- **Secret:** partajat cu `user-service` — configurat in `application.properties`
- **Validare:** semnatura + expirare (prin JJWT `Jwts.parser()`)
- **Claims folosite:** `userId` (Long), `role` (String)

---

## Configurare CORS

Frontend-ul React este permis explicit:

| Proprietate | Valoare |
|---|---|
| `allowedOrigins` | `http://localhost:5173` |
| `allowedMethods` | `GET, POST, PUT, DELETE, PATCH, OPTIONS` |
| `allowedHeaders` | `*` |
| `allowCredentials` | `true` |

> Pentru deployment in productie, `allowedOrigins` trebuie externalizat in `application.properties`.

---

## Coduri de raspuns emise de Gateway

| Cod | Filtru | Cauza |
|---|---|---|
| `401 Unauthorized` | `JwtAuthenticationFilter` | Token absent, expirat sau corupt |
| `403 Forbidden` | `AuthorizationFilter` | Rol insuficient sau ownership nepotrivit |

> Codurile `4xx` si `5xx` emise de microserviciile downstream sunt propagate netransformat catre client.

---

## Configurare `application.properties`

| Proprietate | Descriere |
|---|---|
| `server.port` | `8080` |
| `application.security.jwt.secret-key` | Secret Base64 HS256, partajat cu `user-service` |
| `spring.cloud.gateway.server.webmvc.routes[n].id` | Identificator ruta |
| `spring.cloud.gateway.server.webmvc.routes[n].uri` | URI serviciu destinatie |
| `spring.cloud.gateway.server.webmvc.routes[n].predicates[0]` | Pattern path pentru matching |

---

## Ghid pentru modificari viitoare

### Adaugare endpoint nou intr-un microserviciu existent

| Tip endpoint nou | Actiune necesara in Gateway |
|---|---|
| Accesibil tuturor rolurilor autentificate | Nicio modificare |
| **ADMIN-only** | Adauga `AdminRule` in `ADMIN_ONLY_ROUTES` din `AuthorizationFilter` |
| **Own** — contine `{userId}` sau `{studentId}` in path | Adauga `Pattern` in `OWN_RESOURCE_PATTERNS` din `AuthorizationFilter` |
| Exclusiv STUDENT (serviciu nou blocat pentru TEACHER) | Adauga prefixul in `STUDENT_ONLY_PREFIXES` din `AuthorizationFilter` |

### Adaugare microserviciu nou

1. Adauga ruta in `application.properties`:
```properties
spring.cloud.gateway.server.webmvc.routes[N].id=nume-service
spring.cloud.gateway.server.webmvc.routes[N].uri=http://localhost:PORT
spring.cloud.gateway.server.webmvc.routes[N].predicates[0]=Path=/api/prefix/**
```
2. Evalueaza daca serviciul necesita reguli suplimentare in `AuthorizationFilter` (ADMIN-only routes, own patterns, sau blocare TEACHER).

---

## Structura pachetelor

```
apigateway/
├── config/
│   └── SecurityConfig.java         (SecurityFilterChain, CORS)
├── filter/
│   ├── JwtAuthenticationFilter.java (@Order 1 — autentificare JWT)
│   ├── AuthorizationFilter.java     (@Order 2 — RBAC si ownership)
│   └── MutableHttpServletRequest.java (wrapper pentru injectare headere)
└── util/
    └── JwtUtil.java                 (extractie si validare claims JWT)
```