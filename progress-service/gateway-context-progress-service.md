# API Gateway — Context progress-service

## progress-service

**Port:** 8083
**JWT emitter:** NU

### Endpoint-uri si autorizare

| Metoda | Endpoint | Autorizare |
|---|---|---|
| POST | `/api/progress/attempts` | STUDENT |
| GET | `/api/progress/attempts/student/{studentId}/exercise/{exerciseId}` | STUDENT |
| GET | `/api/progress/lessons/student/{studentId}/lesson/{lessonId}` | STUDENT |
| GET | `/api/progress/lessons/student/{studentId}` | STUDENT |
| GET | `/api/progress/lessons/student/{studentId}/in-progress` | STUDENT |
| GET | `/api/progress/lessons/{lessonId}/leaderboard` | STUDENT, TEACHER |
| GET | `/api/progress/students/leaderboard` | STUDENT, TEACHER |
| GET | `/api/progress/students/{studentId}` | STUDENT, TEACHER |
| GET | `/api/progress/students/{studentId}/exists` | STUDENT, TEACHER, ADMIN |
| GET | `/api/progress/students/admin/all` | ADMIN |