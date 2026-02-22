# chatbot-service

## 1. Responsabilitate

Microserviciu responsabil cu **asistenta conversationala AI** pe platforma de invatare a limbii chineze.
Ofera studentilor un tutor virtual alimentat de **Google Gemini** cu care pot exersa conversatia in limba chineza mandarina si pot cere explicatii de gramatica si vocabular.

Ruleaza pe portul `8084`.

---

## 2. Arhitectura si Structura Pachetelor

Arhitectura respecta principiile **Domain-Driven Design (DDD)**.

```
com.chineselearning.chatbotservice
├── controller/
│   └── ChatController.java             # REST endpoints, depinde doar de dto + service
├── domain/
│   ├── dao/
│   │   ├── IChatSessionDao.java        # JpaRepository pentru ChatSession
│   │   └── IChatMessageDao.java        # JpaRepository pentru ChatMessage
│   ├── dto/
│   │   ├── ChatSessionDto.java
│   │   ├── ChatMessageDto.java
│   │   ├── CreateSessionRequest.java   # Request body pentru crearea unei sesiuni
│   │   ├── SendMessageRequest.java     # Request body pentru trimiterea unui mesaj
│   │   └── SendMessageResponse.java    # Contine mesajul studentului + raspunsul AI
│   ├── ChatSession.java                # Entitate JPA
│   └── ChatMessage.java               # Entitate JPA
└── service/
    ├── AiService.java                  # Comunicare directa cu Google Gemini API via RestTemplate
    └── ChatService.java                # Logica de business: sesiuni, mesaje, mapping entitate <-> DTO
```

**Reguli arhitecturale:**
- Controller-ul NU acceseaza DAO sau entitati direct — doar DTO si Service
- Mapping-ul entitate <-> DTO se face exclusiv in `ChatService` prin metode private helper
- Nu se foloseste MapStruct sau alte librarii de mapping

---

## 3. Modelul Domeniului

### Ierarhia entitatilor

```
ChatSession (1)
    └── ChatMessage (*)
```

### ChatSession
| Camp | Tip | Constrangeri |
|---|---|---|
| id | Long | PK, auto-generated |
| studentId | Long | NOT NULL |
| title | String | nullable |
| startedAt | LocalDateTime | NOT NULL |
| endedAt | LocalDateTime | nullable |

### ChatMessage
| Camp | Tip | Constrangeri |
|---|---|---|
| id | Long | PK, auto-generated |
| session | ChatSession | FK, NOT NULL |
| sender | String | NOT NULL, max 20 chars |
| content | String | TEXT, NOT NULL |
| createdAt | LocalDateTime | NOT NULL |

**Valori posibile pentru `sender`:** `STUDENT`, `AI`

### Relatii JPA
- `ChatSession → ChatMessage`: `@OneToMany(cascade = ALL, orphanRemoval = true)`
- `ChatMessage → ChatSession`: `@ManyToOne(fetch = FetchType.LAZY)`

### Indecsi
- `chat_sessions`: index pe `(student_id)`
- `chat_messages`: index pe `(session_id)`

---

## 4. Endpoints REST

Base path: `/api/chatbot`

### Sesiuni
| Metoda | Path | Descriere | Request | Response |
|---|---|---|---|---|
| POST | `/sessions` | Creeaza o sesiune noua | `CreateSessionRequest` | `201 ChatSessionDto` |
| GET | `/sessions/student/{studentId}` | Toate sesiunile unui student, ordonate DESC dupa `startedAt` | - | `200 List<ChatSessionDto>` |
| PATCH | `/sessions/{sessionId}/end` | Marcheaza sesiunea ca incheiata (seteaza `endedAt`) | - | `200 ChatSessionDto` |

### Mesaje
| Metoda | Path | Descriere | Request | Response |
|---|---|---|---|---|
| POST | `/sessions/{sessionId}/messages` | Trimite un mesaj si primeste raspunsul AI | `SendMessageRequest` | `201 SendMessageResponse` |
| GET | `/sessions/{sessionId}/messages` | Istoricul complet al mesajelor dintr-o sesiune, ordonat ASC | - | `200 List<ChatMessageDto>` |

Documentatie Swagger disponibila la: `http://localhost:8084/swagger-ui/index.html`

---

## 5. DTO-uri

### CreateSessionRequest (request)
| Camp | Tip | Validare |
|---|---|---|
| studentId | Long | @NotNull |
| title | String | nullable |

### ChatSessionDto (response)
Contine toate campurile din entitatea `ChatSession`.

### SendMessageRequest (request)
| Camp | Tip | Validare |
|---|---|---|
| content | String | @NotBlank |

### SendMessageResponse (response)
| Camp | Tip |
|---|---|
| userMessage | ChatMessageDto |
| aiMessage | ChatMessageDto |

### ChatMessageDto (response)
Contine toate campurile din entitatea `ChatMessage`, plus `sessionId` extras din relatia `@ManyToOne`.

---

## 6. Flux principal — sendMessage

```
POST /sessions/{sessionId}/messages
    │
    ├── Validare sesiune existenta si neseincheiata (endedAt == null)
    │
    ├── Salvare mesaj STUDENT in baza de date
    │
    ├── buildContextWindow(sessionId)
    │       → ultimele N mesaje din sesiune (exclusiv mesajul curent)
    │       → inversate in ordine cronologica
    │
    ├── AiService.chat(userMessage, contextWindow)
    │       → construire lista de "contents": system prompt + context + mesaj curent
    │       → HTTP POST catre Google Gemini API
    │       → extragere text din raspuns JSON
    │
    └── Salvare mesaj AI in baza de date
            → return SendMessageResponse (userMessage + aiMessage)
```

---

## 7. Integrarea cu Google Gemini

`AiService` apeleaza direct **Google Gemini REST API** via `RestTemplate`, fara librarii de abstractizare (Spring AI nu este folosit din cauza incompatibilitatii cu Spring Boot 4.x).

### Structura request-ului Gemini

```json
{
  "contents": [
    { "role": "user",  "parts": [{ "text": "<system_prompt>" }] },
    { "role": "model", "parts": [{ "text": "Understood. I will act as your Mandarin Chinese tutor." }] },
    { "role": "user",  "parts": [{ "text": "<mesaj_anterior_student>" }] },
    { "role": "model", "parts": [{ "text": "<raspuns_anterior_ai>" }] },
    { "role": "user",  "parts": [{ "text": "<mesaj_curent_student>" }] }
  ]
}
```

**Observatie:** Gemini API nu suporta un camp dedicat `system` — system prompt-ul este injectat ca primul mesaj de tip `user`, urmat de un `ack` de tip `model`.

### System Prompt

Chatbot-ul este configurat sa:
- Raspunda intai in chineza mandarina (caractere simplificate)
- Adauge transliteratia Pinyin intre paranteze
- Traduca raspunsul in limba detectata din mesajul studentului (romana sau engleza)
- Ofere explicatii de gramatica si vocabular la cerere
- Adapteze complexitatea propozitiilor la nivelul perceput al studentului

### Fereastra de context

Ultimele `N` mesaje din sesiune sunt trimise catre Gemini la fiecare request, unde `N` este configurat prin `chatbot.context.window-size` din `application.properties` (valoare implicita: 20).

---

## 8. Dependente Externe

| Serviciu | Comunicare | Observatii |
|---|---|---|
| Google Gemini API | HTTP REST sincron via `RestTemplate` | Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` |
| `user-service` | **Niciuna** | `studentId` este extras din JWT validat de API Gateway |
| `content-service` | **Niciuna** | Chatbot-ul este complet independent de continutul educational |
| `progress-service` | **Niciuna** | Chatbot-ul nu interactioneaza cu progresul studentului |

---

## 9. Configurare (`application.properties`)

```properties
spring.application.name=chatbot-service
server.port=8084

spring.datasource.url=jdbc:postgresql://localhost:5432/chatbot_database
spring.datasource.username=postgres
spring.datasource.password=<parola>

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

gemini.api.key=<google_ai_studio_api_key>
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

chatbot.context.window-size=20
```

---

## 10. Decizii de Design

- **Fara Spring AI** — Spring AI `2.0.0-M2` este incompatibil cu Spring Boot `4.0.3`. Gemini este apelat direct via `RestTemplate`, ceea ce ofera control total asupra structurii request-ului si elimina dependentele instabile.
- **Chatbot independent** — Nu exista comunicare cu `content-service` sau `progress-service`. Chatbot-ul functioneaza ca un tutor general, fara personalizare bazata pe progresul studentului. Decizie luata pentru simplitate arhitecturala.
- **Fereastra glisanta de context** — In loc sa trimita intreaga conversatie la fiecare request, serviciul trimite doar ultimele N mesaje, configurabil din `application.properties`. Previne depasirea limitei de tokeni Gemini pe sesiuni lungi.
- **System prompt injectat ca mesaj user** — Limitare a Gemini API care nu suporta camp dedicat `system`. Solutia standard este injectarea ca primul mesaj `user` + ack `model`.
- **`@Transactional(readOnly = true)`** — Aplicat pe metodele `getSessionsByStudent` si `getMessages` din `ChatService`.
- **Sesiune creata explicit** — Studentul initiaza manual o sesiune noua (`POST /sessions`) inainte de a trimite mesaje. Elimina ambiguitatea sesiunilor implicite si permite titluri descriptive pentru istoricul conversatiilor.

---

## 11. Tehnologii

- Java 21
- Spring Boot 4.0.3
- Spring Data JPA
- PostgreSQL
- Hibernate
- RestTemplate (HTTP client pentru Gemini API)
- Google Gemini API (gemini-2.0-flash)
- SpringDoc OpenAPI 2.3.0 (Swagger)
- Jakarta Validation (`@NotNull`, `@NotBlank`, `@Valid`)