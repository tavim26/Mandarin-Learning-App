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

---

## Dependente inter-servicii

Serviciul nu are dependente inter-servicii. Opereaza independent.

`studentId` este preluat exclusiv din header-ul `X-User-Id` injectat de API Gateway. Nu este necesar si nu este acceptat in request body.

---

## Schema bazei de date

```
chat_sessions
├── id            BIGINT PK (auto-generated)
├── student_id    BIGINT (not null)
├── title         VARCHAR (nullable — auto-generat din primul mesaj daca nu este furnizat)
├── started_at    TIMESTAMP (not null)
└── ended_at      TIMESTAMP (nullable — null pana la inchiderea sesiunii)

chat_messages
├── id            BIGINT PK (auto-generated)
├── session_id    BIGINT FK → chat_sessions.id (not null)
├── sender        VARCHAR(20) (not null) — STUDENT | AI
├── content       TEXT (not null)
└── created_at    TIMESTAMP (not null)
```

**Relatii:** Un `ChatSession` contine mai multe `ChatMessage`. Stergerea unei sesiuni sterge in cascada toate mesajele asociate.
O sesiune este considerata **activa** daca `endedAt` este `null`. O sesiune **inchisa** nu mai accepta mesaje noi.

---

## Modele de date (DTO-uri)

### `ChatSessionDto`
Returnat de toate endpoint-urile care opereaza pe sesiuni.

```json
{
  "id": 1,
  "studentId": 5,
  "title": "Cum se spune buna ziua in chineza?",
  "startedAt": "2024-01-01T10:00:00",
  "endedAt": null,
  "lastMessagePreview": "你好！(Nǐ hǎo!) Buna ziua! Cu ce te pot ajuta...",
  "messageCount": 12
}
```

> `endedAt` este `null` cat timp sesiunea este activa. Devine non-null dupa apelul `PATCH .../end`.
> `lastMessagePreview` este trunchiat la 60 de caractere. Este `null` daca sesiunea nu are niciun mesaj inca.
> `messageCount` reprezinta numarul total de mesaje din sesiune (STUDENT + AI la un loc).
> `title` este auto-generat din primele 40 de caractere ale primului mesaj daca nu este furnizat la creare.

---

### `ChatMessageDto`
Reprezinta un singur mesaj din conversatie.

```json
{
  "id": 1,
  "sessionId": 1,
  "sender": "STUDENT",
  "content": "Cum se spune multumesc in chineza?",
  "createdAt": "2024-01-01T10:00:00"
}
```

> `sender` poate fi `STUDENT` sau `AI`.

---

### `SendMessageResponse`
Returnat la trimiterea unui mesaj. Contine atat mesajul studentului cat si raspunsul AI intr-un singur apel — nu este necesar un al doilea request.

```json
{
  "userMessage": {
    "id": 1,
    "sessionId": 1,
    "sender": "STUDENT",
    "content": "Cum se spune multumesc in chineza?",
    "createdAt": "2024-01-01T10:00:00"
  },
  "aiMessage": {
    "id": 2,
    "sessionId": 1,
    "sender": "AI",
    "content": "谢谢 (Xièxiè) — Multumesc!",
    "createdAt": "2024-01-01T10:00:03"
  }
}
```

---

### `PagedResponse<T>`
Returnat de toate endpoint-urile paginate.

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

> `page` incepe de la `0`. `last: true` inseamna ca nu mai exista pagini urmatoare.

---

### `CreateSessionRequest`

```json
{
  "title": "Lectia despre salutari"
}
```

> `title` este optional. Daca este omis, va fi auto-generat din primul mesaj trimis in sesiune.
> `studentId` **nu se include in body** — este extras din header-ul `X-User-Id`.

---

### `SendMessageRequest`

```json
{
  "content": "Cum se spune multumesc in chineza?"
}
```

> `content` este obligatoriu si nu poate fi gol sau null.

---

## Comportamentul AI

Tutorul AI este configurat cu urmatoarele reguli de raspuns:
- Raspunde intotdeauna cu textul in chineza (caractere simplificate) primul.
- Dupa textul chinezesc ofera transliteratia Pinyin in paranteze.
- Traduce in limba folosita de student (romana sau engleza — detectata automat).
- Ofera explicatii de gramatica si vocabular la cerere.
- Adapteaza complexitatea propozitiilor la nivelul perceput al studentului.

**Fereastra de context:** la fiecare mesaj trimis, ultimele `N` mesaje din sesiune sunt incluse automat in request-ul catre Gemini. Frontul nu trebuie sa gestioneze contextul conversatiei — serviciul il construieste automat.

---

## Endpoint-uri

### Sesiuni — `/api/chatbot/sessions`

---

#### `POST /api/chatbot/sessions`
Creeaza o sesiune noua de conversatie.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Request body:** `CreateSessionRequest`
- **Response `201`:** `ChatSessionDto`

---

#### `GET /api/chatbot/sessions`
Returneaza toate sesiunile studentului curent, ordonate de la cea mai recenta.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Response `200`:** lista de `ChatSessionDto` (cu `lastMessagePreview` si `messageCount` populate)

---

#### `GET /api/chatbot/sessions/paged`
Returneaza sesiunile studentului curent cu paginare.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Query params:**
    - `page` (optional, default: `0`)
    - `size` (optional, default: `10`)
- **Response `200`:** `PagedResponse<ChatSessionDto>`

---

#### `PATCH /api/chatbot/sessions/{sessionId}/end`
Inchide o sesiune activa. Dupa inchidere, sesiunea nu mai accepta mesaje noi.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Response `200`:** `ChatSessionDto` cu `endedAt` populat
- **Response `403`:** studentul incearca sa inchida sesiunea altui student
- **Response `404`:** sesiunea nu exista
- **Response `409`:** sesiunea este deja inchisa

---

#### `PATCH /api/chatbot/sessions/{sessionId}/rename`
Modifica titlul unei sesiuni existente.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Query params:** `newTitle` (obligatoriu)
- **Exemplu:** `PATCH /api/chatbot/sessions/1/rename?newTitle=Lectia%202`
- **Response `200`:** `ChatSessionDto` cu titlul actualizat
- **Response `403`:** studentul incearca sa modifice sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

#### `DELETE /api/chatbot/sessions/{sessionId}`
Sterge o sesiune si toate mesajele asociate.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Response `204`:** sesiunea a fost stearsa
- **Response `403`:** studentul incearca sa stearga sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

### Mesaje — `/api/chatbot/sessions/{sessionId}/messages`

---

#### `POST /api/chatbot/sessions/{sessionId}/messages`
Trimite un mesaj in sesiune si primeste raspunsul AI.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Request body:** `SendMessageRequest`
- **Comportament intern:**
    1. Salveaza mesajul studentului
    2. Daca este primul mesaj si sesiunea nu are titlu, genereaza titlul automat
    3. Construieste fereastra de context din ultimele N mesaje
    4. Apeleaza Gemini API
    5. Salveaza si returneaza raspunsul AI
- **Response `201`:** `SendMessageResponse`
- **Response `400`:** `content` lipsa sau gol
- **Response `403`:** studentul incearca sa trimita mesaje intr-o sesiune care nu ii apartine
- **Response `404`:** sesiunea nu exista
- **Response `409`:** sesiunea este inchisa
- **Response `503`:** Gemini API indisponibil

> **Important pentru UX:** raspunsul AI poate intarzia 2-5 secunde. Se recomanda afisarea unui indicator de loading dupa trimiterea mesajului, pana la primirea response-ului `201`.

---

#### `GET /api/chatbot/sessions/{sessionId}/messages`
Returneaza toate mesajele din sesiune in ordine cronologica ascendenta.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Response `200`:** lista de `ChatMessageDto`
- **Response `403`:** studentul incearca sa acceseze mesajele din sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

#### `GET /api/chatbot/sessions/{sessionId}/messages/paged`
Returneaza mesajele din sesiune cu paginare, in ordine cronologica ascendenta.

- **Autorizare:** STUDENT (own), ADMIN
- **Headers:** `X-User-Id: {studentId}`
- **Query params:**
    - `page` (optional, default: `0`)
    - `size` (optional, default: `20`)
- **Response `200`:** `PagedResponse<ChatMessageDto>`
- **Response `403`:** studentul incearca sa acceseze mesajele din sesiunea altui student
- **Response `404`:** sesiunea nu exista

---

## Coduri de eroare — referinta rapida pentru frontend

| Cod | Semnificatie | Actiune recomandata in frontend |
|-----|---|---|
| `400` | `content` gol sau lipsa | Valideaza inputul inainte de submit |
| `403` | Acces la resursa altui student | Redirectioneaza sau afiseaza eroare generica |
| `404` | Sesiunea nu exista | Redirectioneaza catre lista sesiuni |
| `409` | Sesiunea este inchisa | Dezactiveaza inputul de mesaj, afiseaza status |
| `503` | Gemini API indisponibil | Afiseaza mesaj de eroare, ofera buton de retry |

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|---|--------|---------|---------|-------|
| POST | /api/chatbot/sessions | | own | | ✓ |
| GET | /api/chatbot/sessions | | own | | ✓ |
| GET | /api/chatbot/sessions/paged | | own | | ✓ |
| PATCH | /api/chatbot/sessions/{sessionId}/end | | own | | ✓ |
| PATCH | /api/chatbot/sessions/{sessionId}/rename | | own | | ✓ |
| DELETE | /api/chatbot/sessions/{sessionId} | | own | | ✓ |
| POST | /api/chatbot/sessions/{sessionId}/messages | | own | | ✓ |
| GET | /api/chatbot/sessions/{sessionId}/messages | | own | | ✓ |
| GET | /api/chatbot/sessions/{sessionId}/messages/paged | | own | | ✓ |

> **own** = verificarea ownership-ului este realizata intern in service prin compararea `studentId` din sesiune cu `X-User-Id` din header. API Gateway nu trebuie sa verifice ownership pentru acest serviciu — doar sa injecteze headerul.
> Toate endpoint-urile necesita header-ul `X-User-Id` injectat de API Gateway.

---

## Flux recomandat de integrare frontend

### Initializarea unui chat nou
```
POST /api/chatbot/sessions
  → primesti ChatSessionDto cu id-ul sesiunii nou create
  → redirectionezi catre pagina de chat cu sessionId
  → titlul sesiunii va fi null pana la primul mesaj trimis
```

### Redarea unui chat existent
```
GET /api/chatbot/sessions/{sessionId}/messages/paged?page=0&size=20
  → afisezi mesajele in ordine cronologica (cel mai vechi primul)
  → la scroll up spre inceputul conversatiei, faci request cu page=1, page=2 etc.
```

### Trimiterea unui mesaj
```
POST /api/chatbot/sessions/{sessionId}/messages
  → afisezi imediat bula de mesaj a studentului in UI (optimistic update)
  → afisezi indicator de loading pentru raspunsul AI
  → la primirea raspunsului 201, afisezi aiMessage din SendMessageResponse
  → daca 503, elimini loading-ul si afisezi eroare cu optiune de retry
  → daca 409, dezactiveaza inputul si marcheaza sesiunea ca inchisa
```

### Sidebar cu lista sesiuni
```
GET /api/chatbot/sessions/paged?page=0&size=10
  → afisezi title, lastMessagePreview, messageCount si startedAt pentru fiecare sesiune
  → la scroll in sidebar, incarci pagina urmatoare (page=1, page=2 etc.)
  → sesiunile cu endedAt != null pot fi marcate vizual ca inactive
```

### Redenumirea unei sesiuni
```
PATCH /api/chatbot/sessions/{sessionId}/rename?newTitle=Noul%20titlu
  → actualizezi titlul in sidebar fara a reincarca lista
```

### Stergerea unei sesiuni
```
DELETE /api/chatbot/sessions/{sessionId}
  → la 204, elimini sesiunea din sidebar
  → daca utilizatorul era in sesiunea stearsa, redirectionezi catre lista
```

---

## Headers injectate de API Gateway

| Header | Tip | Descriere |
|---|---|---|
| `X-User-Id` | `Long` | `userId` din JWT claims |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Configurare `application.properties`

| Proprietate | Descriere |
|---|---|
| `gemini.api.key` | Cheia API pentru Google Gemini |
| `gemini.api.url` | URL-ul endpoint-ului Gemini |
| `chatbot.context.window-size` | Numarul de mesaje anterioare trimise ca context la fiecare request catre Gemini |

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
│       ├── PagedResponse.java
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