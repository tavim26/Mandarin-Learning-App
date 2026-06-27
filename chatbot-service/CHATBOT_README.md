# Chatbot Microservice — Frontend Integration Reference

## Overview

This microservice manages AI-powered chat sessions for the Chinese language learning platform.
It handles session lifecycle, message exchange, and communication with the Gemini AI API.

**Base URL (local development):** `http://localhost:8084`  
**Context path:** `/api/chatbot`  
**API docs (Swagger):** `http://localhost:8084/swagger-ui/index.html`

---

## Authentication

Every request **must** include the following header:

| Header | Type | Description |
|--------|------|-------------|
| `X-User-Id` | `Long` | ID of the authenticated student. The microservice uses this to enforce ownership — a student can only access their own sessions. |

There is no token-based auth at this layer. The gateway/auth service is responsible for
validating the user and injecting `X-User-Id` before forwarding the request.

---

## Data Models

### `ChatSessionDto`

Represents a chat session.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `Long` | no | Unique session ID |
| `studentId` | `Long` | no | ID of the owning student |
| `title` | `String` | yes | Session title. If not set at creation, auto-generated from the first 40 characters of the first message |
| `startedAt` | `LocalDateTime` | no | Session creation timestamp |
| `endedAt` | `LocalDateTime` | yes | `null` = session is **active**. Non-null = session is **closed** |
| `customInstructions` | `String` | yes | Student-defined instructions for the AI tutor for this session |
| `lastMessagePreview` | `String` | yes | First 60 characters of the last message in the session (for sidebar display). `null` if session has no messages |
| `messageCount` | `int` | no | Total number of messages in the session |

### `ChatMessageDto`

Represents a single message within a session.

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | `Long` | no | Unique message ID |
| `sessionId` | `Long` | no | ID of the parent session |
| `sender` | `String` | no | `"STUDENT"` or `"AI"` |
| `content` | `String` | no | Message text |
| `createdAt` | `LocalDateTime` | no | Message timestamp |

### `SendMessageResponse`

Returned when a message is sent successfully. Always contains both messages.

| Field | Type | Description |
|-------|------|-------------|
| `userMessage` | `ChatMessageDto` | The student's message as persisted |
| `aiMessage` | `ChatMessageDto` | The AI tutor's response |

### `PagedResponse<T>`

Wrapper for paginated results.

| Field | Type | Description |
|-------|------|-------------|
| `content` | `List<T>` | Items on the current page |
| `page` | `int` | Current page index (0-based) |
| `size` | `int` | Page size requested |
| `totalElements` | `long` | Total number of items across all pages |
| `totalPages` | `int` | Total number of pages |
| `last` | `boolean` | `true` if this is the last page |

---

## Endpoints

### Sessions

---

#### `POST /api/chatbot/sessions`
Creates a new chat session.

**Headers:** `X-User-Id`

**Request body:**
```json
{
  "title": "My first session",
  "customInstructions": "Focus on food vocabulary. Use HSK 2 level."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | `String` | no | If omitted, the title will be auto-generated from the first message sent |
| `customInstructions` | `String` | no | Extra instructions for the AI tutor. Applied for the lifetime of this session |

**Response:** `201 Created` → `ChatSessionDto`

---

#### `GET /api/chatbot/sessions`
Returns all sessions belonging to the authenticated student, ordered by `startedAt` descending (newest first).

**Headers:** `X-User-Id`

**Response:** `200 OK` → `List<ChatSessionDto>`

Each item includes `messageCount` and `lastMessagePreview`, ready for sidebar display.

---

#### `GET /api/chatbot/sessions/paged`
Returns sessions in pages.

**Headers:** `X-User-Id`

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `int` | `0` | Page index (0-based) |
| `size` | `int` | `10` | Number of sessions per page |

**Response:** `200 OK` → `PagedResponse<ChatSessionDto>`

---

#### `PATCH /api/chatbot/sessions/{sessionId}/rename`
Renames a session.

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `newTitle` | `String` | yes | The new title for the session |

**Response:** `200 OK` → `ChatSessionDto`

---

#### `PATCH /api/chatbot/sessions/{sessionId}/end`
Closes a session. Once closed, no new messages can be sent to it.

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Response:** `200 OK` → `ChatSessionDto` (with `endedAt` populated)

---

#### `DELETE /api/chatbot/sessions/{sessionId}`
Permanently deletes a session and all its messages.

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Response:** `204 No Content`

---

### Messages

---

#### `POST /api/chatbot/sessions/{sessionId}/messages`
Sends a message to the AI tutor and returns both the student's message and the AI response.

> This is the primary interaction endpoint. One call = one student message + one AI response.

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Request body:**
```json
{
  "content": "How do you say 'I am hungry' in Chinese?"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `content` | `String` | yes | Must not be blank. Maximum 4000 characters |

**Response:** `201 Created` → `SendMessageResponse`

```json
{
  "userMessage": {
    "id": 101,
    "sessionId": 5,
    "sender": "STUDENT",
    "content": "How do you say 'I am hungry' in Chinese?",
    "createdAt": "2025-04-10T14:32:00"
  },
  "aiMessage": {
    "id": 102,
    "sessionId": 5,
    "sender": "AI",
    "content": "Chinese: 我饿了。\nPinyin: Wǒ è le.\nTranslation: I am hungry.",
    "createdAt": "2025-04-10T14:32:02"
  }
}
```

> **Note on AI response time:** The AI call is synchronous. Expect a response time of 1–5 seconds
> depending on Gemini API latency. Consider showing a loading indicator while waiting.

> **Note on session title:** If the session was created without a title, it is automatically set
> to the first 40 characters of the first message sent. Subsequent GET requests will reflect this.

---

#### `GET /api/chatbot/sessions/{sessionId}/messages`
Returns all messages in a session, ordered by `createdAt` ascending (oldest first).

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Response:** `200 OK` → `List<ChatMessageDto>`

---

#### `GET /api/chatbot/sessions/{sessionId}/messages/paged`
Returns messages in pages.

**Headers:** `X-User-Id`

**Path parameters:** `sessionId` (`Long`)

**Query parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `int` | `0` | Page index (0-based) |
| `size` | `int` | `20` | Number of messages per page |

Messages are ordered ascending (oldest first), consistent with chat display order.

**Response:** `200 OK` → `PagedResponse<ChatMessageDto>`

---

## Error Handling

All error responses return a plain `String` body with a human-readable message.

| HTTP Status | Cause |
|-------------|-------|
| `400 Bad Request` | Validation failed (e.g. blank message content, message too long) |
| `403 Forbidden` | Student is trying to access or modify a session they do not own |
| `404 Not Found` | Session does not exist |
| `409 Conflict` | Attempting to send a message to a session that has already been closed |
| `503 Service Unavailable` | Gemini AI API is unreachable or returned an invalid response |

**Example error response body (plain text):**
```
Sesiunea cu id 42 este inchisa.
```

> Error messages are currently in Romanian. Handle them as opaque strings on the frontend
> and display your own localized error messages based on the HTTP status code.

---

## Business Rules

These rules define the expected behavior from the frontend's perspective:

**Session states**
- A session is **active** when `endedAt` is `null`.
- A session is **closed** when `endedAt` is a timestamp.
- The send message button/input should be disabled for closed sessions.

**Session title**
- `title` can be `null` immediately after creation if not provided.
- After the first message is sent, the title is auto-set to the first 40 characters of that message (+ `...` if truncated).
- The updated title is reflected in subsequent GET calls — refresh the session after sending the first message if the title needs to be displayed immediately.
- The title can be changed at any time via the rename endpoint, regardless of session state.

**Message ordering**
- Messages are always returned oldest-first (ascending `createdAt`).
- For chat display, render them top-to-bottom in the order returned.

**Sender values**
- `"STUDENT"` — message written by the user.
- `"AI"` — message from the Gemini tutor.
- These are the only two possible values. Use them to determine message bubble alignment/styling.

**AI context window**
- The AI retains the last 20 messages as context per session.
- Older messages are stored in the database but not sent to the AI. This is handled server-side — no frontend action required.

**Custom instructions**
- Set at session creation via `customInstructions`.
- Applied to every AI response within that session.
- Cannot be changed after session creation (no update endpoint exists).
- Displayed in the session detail if the frontend chooses to surface it.

**Pagination**
- Use `/paged` endpoints for lists that may grow large (message history, session list).
- Use the non-paged endpoints only for initial loads where the total count is expected to be small.
- Check `last: true` in `PagedResponse` to know when to stop fetching additional pages.