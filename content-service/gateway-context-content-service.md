# API Gateway — Context content-service

## content-service

**Port:** 8081
**JWT emitter:** NU

---

### Endpoint-uri si autorizare

#### Course Units

| Metoda | Endpoint | Autorizare |
|---|---|---|
| GET | /api/content/units | STUDENT, TEACHER, ADMIN |
| GET | /api/content/units/{id} | STUDENT, TEACHER, ADMIN |
| POST | /api/content/units | TEACHER, ADMIN |
| PUT | /api/content/units/{id} | TEACHER, ADMIN |
| DELETE | /api/content/units/{id} | ADMIN |

#### Lessons

| Metoda | Endpoint | Autorizare |
|---|---|---|
| GET | /api/content/units/{unitId}/lessons | STUDENT, TEACHER, ADMIN |
| GET | /api/content/lessons/{id} | STUDENT, TEACHER, ADMIN |
| POST | /api/content/lessons | TEACHER, ADMIN |
| PUT | /api/content/lessons/{id} | TEACHER, ADMIN |
| DELETE | /api/content/lessons/{id} | ADMIN |

#### Materials

| Metoda | Endpoint | Autorizare |
|---|---|---|
| GET | /api/content/lessons/{lessonId}/materials | STUDENT, TEACHER, ADMIN |
| POST | /api/content/materials | TEACHER, ADMIN |
| DELETE | /api/content/materials/{id} | ADMIN |

#### Exercises

| Metoda | Endpoint | Autorizare |
|---|---|---|
| GET | /api/content/lessons/{lessonId}/exercises | STUDENT, TEACHER, ADMIN |
| GET | /api/content/exercises/{id} | STUDENT, TEACHER, ADMIN |
| POST | /api/content/exercises | TEACHER, ADMIN |
| PUT | /api/content/exercises/{id} | TEACHER, ADMIN |
| DELETE | /api/content/exercises/{id} | ADMIN |