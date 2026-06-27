# Flashcard Microservice — Frontend Integration Guide

## Base URL

```
http://localhost:8086/api/flashcards
```

---

## Authentication

Every request that operates on a specific student's data requires the following header:

```
X-User-Id: <studentId>
```

The value must match the `studentId` in the path or the `studentId` of the resource being accessed. Mismatches return `403 Forbidden`.

---

## Error Responses

| Status | When it occurs |
|--------|---------------|
| `400 Bad Request` | Validation failure on request body (missing fields, exceeded lengths, out-of-range values) |
| `403 Forbidden` | `X-User-Id` does not match the owner of the resource |
| `404 Not Found` | Referenced resource (set, card, progress) does not exist |

All error responses follow Spring's default error body:
```json
{
  "timestamp": "...",
  "status": 403,
  "error": "Forbidden",
  "message": "...",
  "path": "..."
}
```

---

## Data Models

### `FlashcardSetDto`
```json
{
  "id": 1,
  "studentId": 42,
  "title": "HSK 1 Vocabulary",
  "description": "Basic 150 words",
  "cardCount": 30
}
```

### `FlashcardDto`
```json
{
  "id": 10,
  "setId": 1,
  "frontText": "你好",
  "backText": "Hello"
}
```

### `FlashcardProgressDto`
```json
{
  "id": 5,
  "studentId": 42,
  "flashcardId": 10,
  "easinessFactor": 2.50,
  "intervalDays": 6,
  "repetitionCount": 2,
  "nextReviewAt": "2025-01-15T10:30:00",
  "lastReviewedAt": "2025-01-09T10:30:00"
}
```

> **New card (never reviewed):** `id` is `null`, `nextReviewAt` is `null`, `lastReviewedAt` is `null`,
> `easinessFactor` is `2.5`, `intervalDays` and `repetitionCount` are `0`.
> Use `id === null` to detect unseen cards on the frontend.

### `FlashcardReviewDto`
```json
{
  "id": 100,
  "studentId": 42,
  "flashcardId": 10,
  "reviewedAt": "2025-01-09T10:30:00",
  "quality": 4
}
```

### `FlashcardSetStatsDto`
```json
{
  "setId": 1,
  "totalCards": 30,
  "newCards": 10,
  "learningCards": 12,
  "matureCards": 8,
  "dueToday": 15,
  "averageEasinessFactor": 2.35
}
```

> `newCards + learningCards + matureCards = totalCards` always holds.
> `newCards`: never reviewed. `learningCards`: `intervalDays < 21`. `matureCards`: `intervalDays >= 21`.

### `TotalDueStatsDto`
```json
{
  "totalDue": 42,
  "bySet": [
    {
      "setId": 1,
      "setTitle": "HSK 1 Vocabulary",
      "dueCount": 25
    },
    {
      "setId": 2,
      "setTitle": "HSK 2 Vocabulary",
      "dueCount": 17
    }
  ]
}
```

> Sets with `dueCount = 0` are excluded from the `bySet` list.

### `ReviewResultDto`
```json
{
  "review": { ... },
  "progress": { ... }
}
```

> `review` is a `FlashcardReviewDto`. `progress` is a `FlashcardProgressDto` with the updated SM-2 state.

---

## SM-2 Fields — What the Frontend Needs to Know

| Field | Type | Description |
|-------|------|-------------|
| `quality` | `integer` `0–5` | Score the student gives when reviewing a card. **Must be sent by the frontend.** See scale below. |
| `easinessFactor` | `decimal` | Difficulty multiplier. Starts at `2.5`, minimum `1.3`. Lower = harder card. |
| `intervalDays` | `integer` | Days until next review. |
| `repetitionCount` | `integer` | Consecutive correct answers (quality ≥ 3). Resets to `0` on failure. |
| `nextReviewAt` | `datetime` | When the card is due next. `null` for unseen cards. |
| `lastReviewedAt` | `datetime` | Timestamp of the most recent review. `null` for unseen cards. |

### Quality Scale (to display to the student)

| Value | Meaning |
|-------|---------|
| `0` | Complete blackout — no recollection |
| `1` | Incorrect, but the answer felt familiar |
| `2` | Incorrect, but the answer was easy to recall once seen |
| `3` | Correct, but required significant effort |
| `4` | Correct with minor hesitation |
| `5` | Perfect, instant response |

> Quality `< 3` resets the card's progress (interval back to 1 day, repetition count to 0).

---

## Endpoints

---

### Flashcard Sets

#### Create a set
```
POST /sets
X-User-Id: <studentId>
```
```json
{
  "title": "HSK 1 Vocabulary",
  "description": "Optional description"
}
```
| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | Required. Max 255 characters. |
| `description` | `string` | Optional. Max 2000 characters. |

**Response `201`:** `FlashcardSetDto`

---

#### Get all sets for a student
```
GET /sets/student/{studentId}
X-User-Id: <studentId>
```
**Response `200`:** `FlashcardSetDto[]` — ordered by `id` descending (newest first).

---

#### Get a set by ID
```
GET /sets/{setId}
```
**Response `200`:** `FlashcardSetDto`

---

#### Update a set
```
PUT /sets/{setId}
X-User-Id: <studentId>
```
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```
| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | Required. Max 255 characters. |
| `description` | `string` | Optional. Max 2000 characters. |

**Response `200`:** `FlashcardSetDto`

---

#### Delete a set
```
DELETE /sets/{setId}
X-User-Id: <studentId>
```
> Deletes the set and all its cards, progress records, and review history.

**Response `204`:** No content.

---

#### Get set statistics
```
GET /sets/{setId}/stats
X-User-Id: <studentId>
```
**Response `200`:** `FlashcardSetStatsDto`

---

### Flashcards

#### Create a flashcard
```
POST /cards
X-User-Id: <studentId>
```
```json
{
  "setId": 1,
  "frontText": "你好",
  "backText": "Hello"
}
```
| Field | Type | Constraints |
|-------|------|-------------|
| `setId` | `long` | Required. Must reference an existing set owned by the student. |
| `frontText` | `string` | Required. Max 2000 characters. |
| `backText` | `string` | Required. Max 2000 characters. |

**Response `201`:** `FlashcardDto`

---

#### Get all cards in a set
```
GET /sets/{setId}/cards
```
**Response `200`:** `FlashcardDto[]`

---

#### Get a card by ID
```
GET /cards/{flashcardId}
```
**Response `200`:** `FlashcardDto`

---

#### Update a flashcard
```
PUT /cards/{flashcardId}
X-User-Id: <studentId>
```
```json
{
  "frontText": "你好",
  "backText": "Hello (updated)"
}
```
| Field | Type | Constraints |
|-------|------|-------------|
| `frontText` | `string` | Required. Max 2000 characters. |
| `backText` | `string` | Required. Max 2000 characters. |

**Response `200`:** `FlashcardDto`

---

#### Delete a flashcard
```
DELETE /cards/{flashcardId}
X-User-Id: <studentId>
```
> Deletes the card along with its progress record and review history.

**Response `204`:** No content.

---

### Reviews & Progress

#### Get all due cards for a set
```
GET /reviews/due/{studentId}?setId={setId}
X-User-Id: <studentId>
```
**Response `200`:** `FlashcardProgressDto[]`

Returns two types of cards combined:
- Cards with `nextReviewAt <= now` (due for review)
- Cards with `id === null` (never reviewed — new cards)

> This is the primary endpoint for the study/review session screen.
> Use `id === null` to distinguish new cards from due cards if needed.

---

#### Submit a review
```
POST /reviews
X-User-Id: <studentId>
```
```json
{
  "flashcardId": 10,
  "quality": 4
}
```
| Field | Type | Constraints |
|-------|------|-------------|
| `flashcardId` | `long` | Required. |
| `quality` | `integer` | Required. Must be `0–5`. |

**Response `201`:** `ReviewResultDto` — contains the saved review and the updated SM-2 progress state.

---

#### Get due card counts across all sets
```
GET /reviews/due/all
X-User-Id: <studentId>
```
**Response `200`:** `TotalDueStatsDto`

> Useful for a dashboard screen showing a summary of pending reviews across all sets.
> Sets with no due cards are excluded from the response.

---

#### Get review history for a card
```
GET /reviews/history/{studentId}/{flashcardId}
X-User-Id: <studentId>
```
**Response `200`:** `FlashcardReviewDto[]` — ordered chronologically ascending.

---

#### Get current SM-2 progress for a card
```
GET /reviews/progress/{studentId}/{flashcardId}
X-User-Id: <studentId>
```
**Response `200`:** `FlashcardProgressDto`

> Returns `404` if the student has never reviewed this card.

---

## Typical Frontend Flows

### Study session flow
1. Call `GET /reviews/due/{studentId}?setId={setId}` to load the cards to review.
2. Show each card to the student (front → reveal back).
3. Student selects a quality score (0–5).
4. Call `POST /reviews` with `flashcardId` and `quality`.
5. Use the returned `ReviewResultDto.progress` to show updated SM-2 info if needed.
6. Repeat for all due cards.

### Dashboard flow
1. Call `GET /reviews/due/all` to show total pending reviews per set.
2. Navigate to a set → call `GET /sets/{setId}/stats` for detailed statistics.

### Set management flow
1. `POST /sets` → create set.
2. `POST /cards` (repeated) → add cards to the set.
3. `PUT` / `DELETE` endpoints for edits and deletions.

---

## Interactive API Documentation

```
http://localhost:8086/swagger-ui/index.html
```