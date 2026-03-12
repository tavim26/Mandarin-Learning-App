# API Gateway — Context flashcard-service

## flashcard-service

**Port:** 8086
**JWT emitter:** NU

### Endpoint-uri si autorizare

| Metoda | Endpoint | Autorizare |
|---|---|---|
| POST | `/api/flashcards/sets` | STUDENT |
| GET | `/api/flashcards/sets/student/{studentId}` | STUDENT |
| GET | `/api/flashcards/sets/{setId}` | STUDENT |
| PUT | `/api/flashcards/sets/{setId}` | STUDENT |
| DELETE | `/api/flashcards/sets/{setId}` | STUDENT |
| POST | `/api/flashcards/cards` | STUDENT |
| GET | `/api/flashcards/sets/{setId}/cards` | STUDENT |
| GET | `/api/flashcards/cards/{flashcardId}` | STUDENT |
| PUT | `/api/flashcards/cards/{flashcardId}` | STUDENT |
| DELETE | `/api/flashcards/cards/{flashcardId}` | STUDENT |
| POST | `/api/flashcards/reviews` | STUDENT |
| GET | `/api/flashcards/reviews/due/{studentId}` | STUDENT |
| GET | `/api/flashcards/reviews/history/{studentId}/{flashcardId}` | STUDENT |
| GET | `/api/flashcards/reviews/progress/{studentId}/{flashcardId}` | STUDENT |

### Note de autorizare

- Toate endpoint-urile sunt accesibile exclusiv studentilor autentificati
- `studentId` din path si din request body trebuie sa corespunda cu `userId` din JWT-ul validat de Gateway
- Nu exista endpoint-uri publice
- Nu exista endpoint-uri restrictionate la ADMIN sau TEACHER
- Serviciul nu valideaza JWT-ul intern — autentificarea si autorizarea sunt delegate complet catre API Gateway