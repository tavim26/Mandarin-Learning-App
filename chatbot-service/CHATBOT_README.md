# chatbot-service

- **Port:** `8084`
- **Baza de date:** PostgreSQL — `chatbot_database`
- **Swagger UI:** `http://localhost:8084/swagger-ui/index.html`

`studentId` provine exclusiv din header-ul `X-User-Id` injectat de API Gateway. Nu se include in request body.

---

## DTO-uri

### `ChatSessionDto`
```json
{
  "id": 1,
  "studentId": 5,
  "title": "Cum se spune buna ziua?",
  "startedAt": "2024-01-01T10:00:00",
  "endedAt": null,
  "lastMessagePreview": "你好！(Nǐ hǎo!) Buna ziua! Cu ce te pot...",
  "messageCount": 12,
  "customInstructions": "Foloseste doar vocabular HSK 2."
}
```
> `endedAt` — `null` cat timp sesiunea e activa. Non-null dupa `PATCH .../end`.
> `lastMessagePreview` — trunchiat la 60 caractere. `null` daca sesiunea nu are mesaje.
> `title` — auto-generat din primele 40 caractere ale primului mesaj daca nu e furnizat la creare.
> `customInstructions` — `null` daca nu au fost setate la creare.

---

### `ChatMessageDto`
```json
{
  "id": 1,
  "sessionId": 1,
  "sender": "STUDENT",
  "content": "Cum se spune multumesc?",
  "createdAt": "2024-01-01T10:00:00"
}
```
> `sender` — `STUDENT` sau `AI`.

---

### `SendMessageResponse`
```json
{
  "userMessage": { ...ChatMessageDto },
  "aiMessage": { ...ChatMessageDto }
}
```
> Ambele mesaje sunt returnate intr-un singur apel. Nu e necesar un request separat pentru raspunsul AI.

---

### `PagedResponse<T>`
```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 47,
  "totalPages": 5,
  "last": false
}
```
> `page` incepe de la `0`. `last: true` = nu mai exista pagini urmatoare.

---

### `CreateSessionRequest`
```json
{
  "title": "Lectia despre salutari",
  "customInstructions": "Corecteaza-ma daca fac greseli gramaticale."
}
```
> Ambele campuri sunt optionale. `studentId` **nu se include**.

---

### `SendMessageRequest`
```json
{
  "content": "Cum se spune multumesc in chineza?"
}
```
> `content` este obligatoriu si nu poate fi gol.

---

## Endpoint-uri

### Sesiuni

| Method | Path | Body / Params | Response |
|--------|------|---------------|----------|
| `POST` | `/api/chatbot/sessions` | `CreateSessionRequest` | `201` `ChatSessionDto` |
| `GET` | `/api/chatbot/sessions` | — | `200` `List<ChatSessionDto>` |
| `GET` | `/api/chatbot/sessions/paged` | `?page=0&size=10` | `200` `PagedResponse<ChatSessionDto>` |
| `PATCH` | `/api/chatbot/sessions/{sessionId}/end` | — | `200` `ChatSessionDto` |
| `PATCH` | `/api/chatbot/sessions/{sessionId}/rename` | `?newTitle=...` | `200` `ChatSessionDto` |
| `DELETE` | `/api/chatbot/sessions/{sessionId}` | — | `204` |

---

### Mesaje

| Method | Path | Body / Params | Response |
|--------|------|---------------|----------|
| `POST` | `/api/chatbot/sessions/{sessionId}/messages` | `SendMessageRequest` | `201` `SendMessageResponse` |
| `GET` | `/api/chatbot/sessions/{sessionId}/messages` | — | `200` `List<ChatMessageDto>` |
| `GET` | `/api/chatbot/sessions/{sessionId}/messages/paged` | `?page=0&size=20` | `200` `PagedResponse<ChatMessageDto>` |

---

## Coduri de eroare

| Cod | Cauza | Actiune recomandata |
|-----|-------|---------------------|
| `400` | `content` gol sau lipsa | Valideaza inputul inainte de submit |
| `403` | Acces la sesiunea altui student | Afiseaza eroare, redirectioneaza |
| `404` | Sesiunea nu exista | Redirectioneaza catre lista sesiuni |
| `409` | Sesiunea este inchisa | Dezactiveaza inputul de mesaj |
| `503` | Gemini API indisponibil | Afiseaza eroare, ofera retry |

---

## Autorizare (pentru API Gateway)

| Method | Path | STUDENT | TEACHER | ADMIN |
|--------|------|---------|---------|-------|
| `POST` | /api/chatbot/sessions | own | | ✓ |
| `GET` | /api/chatbot/sessions | own | | ✓ |
| `GET` | /api/chatbot/sessions/paged | own | | ✓ |
| `PATCH` | /api/chatbot/sessions/{sessionId}/end | own | | ✓ |
| `PATCH` | /api/chatbot/sessions/{sessionId}/rename | own | | ✓ |
| `DELETE` | /api/chatbot/sessions/{sessionId} | own | | ✓ |
| `POST` | /api/chatbot/sessions/{sessionId}/messages | own | | ✓ |
| `GET` | /api/chatbot/sessions/{sessionId}/messages | own | | ✓ |
| `GET` | /api/chatbot/sessions/{sessionId}/messages/paged | own | | ✓ |

> **own** = ownership verificat intern in service. API Gateway injecteaza doar `X-User-Id` si `X-User-Role`, nu verifica ownership.

---

## Headers injectate de API Gateway

| Header | Tip | Descriere |
|--------|-----|-----------|
| `X-User-Id` | `Long` | `userId` din JWT |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Note pentru frontend

**Trimitere mesaj** — raspunsul AI poate intarzia 2-5 secunde. Afiseaza loading indicator pana la primirea `201`.

**Sidebar sesiuni** — foloseste `GET /sessions/paged`. Campurile `lastMessagePreview`, `messageCount` si `title` sunt gata de afisat direct.

**Sesiune inchisa** — daca `endedAt != null`, dezactiveaza inputul de mesaj si afiseaza un indicator vizual de status.

**Instrucțiuni personalizate** — la crearea sesiunii, studentul poate furniza `customInstructions` care modifica comportamentul AI exclusiv pentru acea sesiune.