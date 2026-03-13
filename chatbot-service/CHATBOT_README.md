# chatbot-service

Microserviciu responsabil pentru gestionarea sesiunilor de conversatie cu un tutor AI de limba chineza mandarina, bazat pe Google Gemini API.

- **Port:** `8084`
- **Baza de date:** PostgreSQL — `chatbot_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8084/swagger-ui/index.html`

---

## Tech Stack

- Java 21, Spring Boot, Spring Data JPA
- PostgreSQL
- RestTemplate (comunicare sincrona cu Google Gemini API)
- SpringDoc 2.3.0

---

## Dependente inter-servicii

Serviciul nu are dependente inter-servicii. Opereaza independent.

`studentId` este preluat exclusiv din header-ul `X-User-Id` injectat de API Gateway.

---

## Schema bazei de date

```
chat_sessions
├── id            BIGINT PK (auto-generated)
├── student_id    BIGINT (not null)
├── title         VARCHAR (nullable)
├── started_at    TIMESTAMP (not null)
└── ended_at      TIMESTAMP (nullable — null pana la inchiderea sesiunii)

chat_messages
├── id            BIGINT PK (auto-generated)
├── session_id    BIGINT FK → chat_sessions.id (not null)
├── sender        VARCHAR(20) (not null) — STUDENT | AI
├── content       TEXT (not null)
└── created_at    TIMESTAMP (not null)

INDEX: idx_chat_messages_session_id ON chat_messages(session_id)
```

**Relatii:** Un `ChatSession` contine mai multe `ChatMessage` (CASCADE DELETE, orphanRemoval).
O sesiune este considerata activa daca `ended_at` este `null`.

---

## Modele de date (DTO-uri)

### `ChatSessionDto`
```json
{
  "id": 1,
  "studentId": 1,
  "title": "Lectia 1 - Salutari",
  "startedAt": "2024-01-01T10:00:00",
  "endedAt": null
}
```
> `endedAt` este `null` pana la apelul `PATCH /sessions/{sessionId}/end`.

### `ChatMessageDto`
```json
{
  "id": 1,
  "sessionId": 1,
  "sender": "STUDENT",
  "content": "Buna ziua! Cum se spune multumesc in chineza?",
  "createdAt": "2024-01-01T10:00:00"
}
```

### `SendMessageResponse`
```json
{
  "userMessage": {
    "id": 1,
    "sessionId": 1,
    "sender": "STUDENT",
    "content": "Buna ziua!",
    "createdAt": "2024-01-01T10:00:00"
  },
  "aiMessage": {
    "id": 2,
    "sessionId": 1,
    "sender": "AI",
    "content": "你好！(Nǐ hǎo!) Buna ziua!",
    "createdAt": "2024-01-01T10:00:01"
  }
}
```

### `CreateSessionRequest` (request body)
```json
{
  "title": "Lectia 1 - Salutari"
}
```
> `studentId` este absent din request body — este extras din header-ul `X-User-Id`.

### `SendMessageRequest` (request body)
```json
{
  "content": "Cum se spune multumesc in chineza?"
}
```

---

## Comportamentul AI

Tutorul AI este configurat prin system prompt intern cu urmatoarele reguli:
- Raspunde intotdeauna cu textul in chineza (caractere simplificate) primul.
- Dupa textul chinezesc ofera transliteratia Pinyin in paranteze.
- Traduce in limba folosita de student (romana sau engleza).
- Ofera explicatii de gramatica si vocabular la cerere.
- Adapteaza complexitatea propozitiilor la nivelul perceput al studentului.

**Fereastra de context:** ultimele `N` mesaje din sesiune sunt trimise la Gemini la fiecare request, unde `N` este configurabil prin `application.properties`.

---

## Endpoint-uri

### Sesiuni — `/api/chatbot/sessions`

#### `POST /api/chatbot/sessions`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `CreateSessionRequest`
- **Comportament:** creeaza o sesiune noua activa pentru studentul identificat prin `X-User-Id`.
- **Response `201`:** `ChatSessionDto`

---

#### `GET /api/chatbot/sessions`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** returneaza toate sesiunile studentului identificat prin `X-User-Id`, ordonate dupa `startedAt` descrescator.
- **Response `200`:** lista de `ChatSessionDto`

---

#### `PATCH /api/chatbot/sessions/{sessionId}/end`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** seteaza `endedAt` la momentul curent. Dupa inchidere, sesiunea nu mai accepta mesaje.
- **Response `200`:** `ChatSessionDto` actualizat
- **Response `403`:** studentul incearca sa inchida sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

### Mesaje — `/api/chatbot/sessions/{sessionId}/messages`

#### `POST /api/chatbot/sessions/{sessionId}/messages`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Request body:** `SendMessageRequest`
- **Comportament:** salveaza mesajul studentului, construieste fereastra de context, apeleaza Gemini API, salveaza raspunsul AI. Daca sesiunea este inchisa, returneaza `409`.
- **Response `201`:** `SendMessageResponse`
- **Response `403`:** studentul incearca sa trimita mesaje intr-o sesiune care nu ii apartine
- **Response `404`:** sesiunea nu exista
- **Response `409`:** sesiunea este inchisa
- **Response `503`:** Gemini API indisponibil

---

#### `GET /api/chatbot/sessions/{sessionId}/messages`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`
- **Comportament:** returneaza toate mesajele din sesiune in ordine cronologica ascendenta.
- **Response `200`:** lista de `ChatMessageDto`
- **Response `403`:** studentul incearca sa acceseze mesajele din sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path                                      | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|-------------------------------------------|--------|---------|---------|-------|
| POST   | /api/chatbot/sessions                     |        | own     |         | ✓     |
| GET    | /api/chatbot/sessions                     |        | own     |         | ✓     |
| PATCH  | /api/chatbot/sessions/{sessionId}/end     |        | own     |         | ✓     |
| POST   | /api/chatbot/sessions/{sessionId}/messages|        | own     |         | ✓     |
| GET    | /api/chatbot/sessions/{sessionId}/messages|        | own     |         | ✓     |

> **own** = verificarea ownership-ului este realizata intern in service prin compararea `studentId` din sesiune cu `X-User-Id` din header.
> Toate endpoint-urile necesita header-ul `X-User-Id` injectat de API Gateway.

---

## Headers injectate de API Gateway

| Header       | Tip    | Descriere                        |
|--------------|--------|----------------------------------|
| `X-User-Id`  | `Long` | `userId` din JWT claims          |
| `X-User-Role`| `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Configurare `application.properties`

| Proprietate                        | Descriere                                          |
|------------------------------------|----------------------------------------------------|
| `gemini.api.key`                   | Cheia API pentru Google Gemini                     |
| `gemini.api.url`                   | URL-ul endpoint-ului Gemini                        |
| `chatbot.context.window-size`      | Numarul de mesaje anterioare trimise ca context    |

---

## Structura pachetelor

```
chatbotservice/
├── domain/
│   ├── ChatMessage.java
│   ├── ChatSession.java
│   ├── dao/
│   │   ├── IChatMessageDao.java
│   │   └── IChatSessionDao.java
│   └── dto/
│       ├── ChatMessageDto.java
│       ├── ChatSessionDto.java
│       ├── CreateSessionRequest.java
│       ├── SendMessageRequest.java
│       └── SendMessageResponse.java
├── repository/
│   ├── entities/
│   │   ├── ChatMessageEntity.java
│   │   └── ChatSessionEntity.java
│   ├── jpa/
│   │   ├── ChatMessageJpaRepository.java
│   │   └── ChatSessionJpaRepository.java
│   ├── ChatMessageDao.java
│   └── ChatSessionDao.java
├── service/
│   ├── AiService.java
│   └── ChatService.java
├── controller/
│   └── ChatController.java
└── config/
    └── AppConfig.java
```