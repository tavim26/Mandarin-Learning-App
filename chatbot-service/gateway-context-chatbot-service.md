# API Gateway — Context chatbot-service

## chatbot-service

**Port:** `8084`
**JWT emitter:** NU

### Endpoint-uri si autorizare

| Metoda | Endpoint | Autorizare |
|---|---|---|
| POST | `/api/chatbot/sessions` | STUDENT |
| GET | `/api/chatbot/sessions/student/{studentId}` | STUDENT |
| PATCH | `/api/chatbot/sessions/{sessionId}/end` | STUDENT |
| POST | `/api/chatbot/sessions/{sessionId}/messages` | STUDENT |
| GET | `/api/chatbot/sessions/{sessionId}/messages` | STUDENT |