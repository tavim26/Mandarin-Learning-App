# API Gateway — Context Microservicii

---

## user-service
**Port:** 8082
**JWT emitter:** DA — acest serviciu este singurul care genereaza token JWT

### Endpoint-uri si autorizare

| Metoda | Endpoint | Autorizare |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| POST | /api/users | ADMIN |
| GET | /api/users | ADMIN |
| GET | /api/users/{id} | ADMIN, STUDENT, TEACHER |
| GET | /api/users/search?name= | ADMIN |
| PUT | /api/users/{id}/name | ADMIN |
| DELETE | /api/users/{id} | ADMIN |
| GET | /api/users/students/{userId} | ADMIN, STUDENT |
| PUT | /api/users/students/{userId}/nickname | ADMIN, STUDENT |
| GET | /api/users/teachers/{userId} | ADMIN, TEACHER |
| PUT | /api/users/teachers/{userId}/title | ADMIN, TEACHER |

### JWT
- Algoritm: HS256
- Claims: { sub: email, userId: Long, role: String }
- Configurat in: application.security.jwt.secret-key

---
