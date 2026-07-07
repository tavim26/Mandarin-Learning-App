# API Gateway — Frontend Integration Reference

Punctul unic de intrare pentru toate requesturile către platformă.
Orice request de la frontend trece **exclusiv** prin gateway — niciun microserviciu nu este apelat direct.

**Base URL (local):** `http://localhost:8080`
**Port Docker:** `8080`

---

## Autentificare

### Flux

1. Frontend-ul trimite email + parolă la `POST /api/auth/login`
2. User Service returnează un **token JWT** în câmpul `token`
3. Frontend-ul stochează token-ul (ex. `localStorage`)
4. **Fiecare request ulterior** include token-ul în header-ul `Authorization`

### Header obligatoriu (toate requesturile protejate)

```
Authorization: Bearer <token>
```

### Durata de viață a token-ului

Token-ul expiră după **24 de ore**. Nu există mecanism de refresh — la expirare utilizatorul trebuie să se autentifice din nou.

### Payload JWT (decodabil client-side fără cheie secretă)

```json
{
  "sub": "user@email.com",
  "userId": 1,
  "role": "STUDENT",
  "iat": 1234567890,
  "exp": 1234654290
}
```

Câmpurile `userId` și `role` din payload sunt singurele valori de identitate de care frontul are nevoie după login — nu este necesar un request suplimentar pentru ele.

---

## Endpoint-uri publice (fără autentificare)

Doar aceste două rute sunt accesibile fără header `Authorization`:

| Metodă | Endpoint |
|--------|----------|
| `POST` | `/api/auth/register` |
| `POST` | `/api/auth/login` |

Orice alt request fără token valid primește `401 Unauthorized`.

---

## CORS

Gateway-ul aplică politica CORS global pentru toate rutele.

| Parametru | Valoare |
|-----------|---------|
| Origini permise | `http://localhost:5173`, `http://localhost` |
| Metode permise | `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS` |
| Headere permise | `*` (orice header) |
| Credentials | `true` (cookies + Authorization header) |

Dacă frontul rulează pe altă origine (ex. port diferit), gateway-ul va refuza requesturile cu eroare CORS.

---

## Tabel de rutare

Gateway-ul rutează requesturile pe baza path-ului către microserviciul corespunzător.

| Path prefix | Microserviciu | Port local | Variabilă de mediu |
|-------------|---------------|------------|--------------------|
| `/api/auth/**`, `/api/users/**` | User Service | `8082` | `USER_SERVICE_URL` |
| `/api/content/**` | Content Service | `8081` | `CONTENT_SERVICE_URL` |
| `/api/progress/**` | Progress Service | `8083` | `PROGRESS_SERVICE_URL` |
| `/api/chatbot/**` | Chatbot Service | `8084` | `CHATBOT_SERVICE_URL` |
| `/api/analysis/**` | Analysis Service | `8085` | `ANALYSIS_SERVICE_URL` |
| `/api/flashcards/**` | Flashcard Service | `8086` | `FLASHCARD_SERVICE_URL` |

Path-ul din request este transmis **nemodificat** către microserviciu.

---

## Headere injectate de gateway

După validarea JWT-ului, gateway-ul **injectează automat** aceste headere în requestul trimis downstream. Frontul nu le setează manual.

| Header injectat | Extras din JWT | Folosit de |
|-----------------|----------------|------------|
| `X-User-Id` | `userId` | Toate microserviciile |
| `X-User-Role` | `role` | Progress Service, Analysis Service |
| `X-User-Email` | `sub` (email) | User Service (`/api/users/me`) |

Header-ul `Authorization` original este **eliminat** înainte de forwarding — microserviciile nu primesc JWT-ul, primesc exclusiv headerele de mai sus.

---

## Reguli de autorizare

### Roluri disponibile

| Valoare | Descriere |
|---------|-----------|
| `STUDENT` | Utilizator student |
| `TEACHER` | Utilizator profesor |
| `ADMIN` | Administrator |

### Rute blocate complet pentru rolul `TEACHER`

Profesorii nu pot accesa aceste servicii — orice request primește `403 Forbidden`:

```
/api/flashcards/**
/api/analysis/**
/api/chatbot/**
```

### Rute accesibile exclusiv rolului `ADMIN`

Orice alt rol primește `403 Forbidden` pe aceste rute:

| Metodă | Path |
|--------|------|
| `POST` | `/api/users` |
| `GET` | `/api/users` |
| `GET` | `/api/users/{id}` |
| `GET` | `/api/users/search` |
| `PUT` | `/api/users/{id}/name` |
| `PUT` | `/api/users/{id}/password/reset` |
| `PUT` | `/api/users/{id}/ban` |
| `PUT` | `/api/users/{id}/unban` |
| `DELETE` | `/api/users/{id}` |
| `GET` | `/api/users/students` |
| `GET` | `/api/users/teachers` |
| `GET` | `/api/progress/students/admin/all` |

### Rute restricționate la resursa proprie

Un `STUDENT` sau `TEACHER` poate accesa aceste rute **doar pentru propriul `id`** (adică `{id}` din path trebuie să coincidă cu `userId` din token). Alt `id` → `403 Forbidden`.

| Path pattern |
|-------------|
| `/api/flashcards/sets/student/{id}/**` |
| `/api/progress/students/{id}/**` |
| `/api/progress/lessons/student/{id}/**` |
| `/api/progress/attempts/student/{id}/**` |
| `/api/progress/units/{unitId}/student/{id}/**` |
| `/api/analysis/student/{id}/**` |
| `/api/users/students/{id}/**` |
| `/api/users/teachers/{id}/**` |
| `/api/users/{id}/email` |
| `/api/users/{id}/password` |

---

## Format răspunsuri de eroare

Toate erorile generate de gateway (nu de microservicii) returnează JSON:

```json
{ "error": "mesaj descriptiv" }
```

| Status HTTP | Cauză | Mesaj posibil |
|-------------|-------|---------------|
| `401 Unauthorized` | Header `Authorization` lipsă sau malformat | `"Token JWT lipsa sau invalid"` |
| `401 Unauthorized` | Token expirat sau corupt | `"Token JWT expirat sau corupt"` |
| `401 Unauthorized` | Token fără claims obligatorii | `"Token JWT incomplet"` |
| `403 Forbidden` | Rol insuficient sau acces la resursa altui utilizator | `"Acces interzis — ..."` |

Erorile provenite din microservicii (ex. `404`, `400`, `503`) sunt **pasate nemodificate** — fiecare microserviciu are propriul format de eroare documentat în README-ul său.

---

## Flux complet al unui request

```
Frontend
   │
   │  GET /api/progress/students/42/summary
   │  Authorization: Bearer eyJ...
   │
   ▼
API Gateway :8080
   │
   ├─ (1) Validează semnătura JWT și expirarea
   ├─ (2) Extrage userId=42, role="STUDENT", email="..."
   ├─ (3) Verifică regulile de autorizare
   │       → STUDENT accesează /progress/students/42 → userId din token = 42 ✅
   ├─ (4) Injectează X-User-Id: 42, X-User-Role: STUDENT, X-User-Email: ...
   ├─ (5) Elimină header-ul Authorization
   └─ (6) Rutează spre Progress Service :8083
              │
              ▼
         GET /api/progress/students/42/summary
         X-User-Id: 42
         X-User-Role: STUDENT
         X-User-Email: student@email.com
```