# Text Analysis Service — Frontend Integration Guide

## Overview

This microservice is part of the **Chinese Language Learning Platform**. It handles Chinese text analysis using NLP, OCR image processing, and Google Translate integration. Every request passes through the **API Gateway**, which injects authentication headers — the frontend does **not** manage authentication directly with this service.

- **Base URL:** `http://localhost:8085`
- **API Prefix:** `/api/analysis`
- **Interactive docs (Swagger UI):** `http://localhost:8085/docs`

---

## Required Headers

Every request to this service **must** include the following headers. In production, these are injected automatically by the API Gateway. During local development and Swagger testing, add them manually.

| Header | Type | Allowed Values | Description |
|--------|------|----------------|-------------|
| `X-User-Id` | `integer` | any user ID | The authenticated user's ID |
| `X-User-Role` | `string` | `STUDENT` | The authenticated user's role. Teachers are blocked from this service. |

> ⚠️ **Note:** Requests with `X-User-Role: TEACHER` will always receive `403 Forbidden`.

---

## Access Control Rules

| Scenario | Result |
|----------|--------|
| Role is `TEACHER` | `403` — always blocked |
| Role is `STUDENT`, accessing own resources (`X-User-Id` matches `student_id`) | ✅ Allowed |
| Role is `STUDENT`, accessing another student's resources | `403` — blocked |

---

## Data Models

### `TextAnalysisDto`
Returned by `POST /text`, `POST /ocr`, and `GET /{analysis_id}`.

```json
{
  "id": 1,
  "student_id": 42,
  "raw_text": "你好世界",
  "source_type": "MANUAL",
  "overall_hsk_level": 1,
  "created_at": "2024-06-01T10:30:00",
  "translated_text": "Hello World",
  "translation_language": "en",
  "tokens": [
    {
      "id": 1,
      "analysis_id": 1,
      "hanzi": "你好",
      "pinyin": "nǐ hǎo",
      "translation": "Hello",
      "hsk_level": 1,
      "position_index": 0,
      "pos": "verb"
    },
    {
      "id": 2,
      "analysis_id": 1,
      "hanzi": "世界",
      "pinyin": "shì jiè",
      "translation": "World",
      "hsk_level": 1,
      "position_index": 1,
      "pos": "noun"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | `integer` | Unique analysis ID |
| `student_id` | `integer` | Owner student ID |
| `raw_text` | `string` | Original Chinese text |
| `source_type` | `string` | `"MANUAL"` or `"OCR"` |
| `overall_hsk_level` | `integer \| null` | Dominant HSK level (1–6), null if no HSK characters |
| `created_at` | `string (ISO 8601)` | Creation timestamp |
| `translated_text` | `string \| null` | Full text translation |
| `translation_language` | `string` | Language used: `"en"`, `"ro"`, `"de"`, `"es"`, `"fr"` |
| `tokens` | `array` | Individual Chinese tokens (see below) |

### `AnalysisTokenDto`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `integer` | Token ID |
| `analysis_id` | `integer` | Parent analysis ID |
| `hanzi` | `string` | Chinese character(s) |
| `pinyin` | `string \| null` | Romanized pronunciation with tone marks |
| `translation` | `string \| null` | Individual token translation |
| `hsk_level` | `integer \| null` | HSK level (1–6), null if not in HSK |
| `position_index` | `integer` | Token order in the original text (0-based) |
| `pos` | `string \| null` | Part of speech (see values below) |

**`pos` possible values:**

| Value | Meaning |
|-------|---------|
| `"substantiv"` | noun |
| `"verb"` | verb |
| `"adjectiv"` | adjective |
| `"adverb"` | adverb |
| `"pronume"` | pronoun |
| `"nume propriu"` | proper noun |
| `"numar"` | number |
| `"particula"` | particle |
| `"prepozitie"` | preposition |
| `"conjunctie"` | conjunction |
| `"determinant"` | determiner |
| `"auxiliar"` | auxiliary verb |
| `"interjectie"` | interjection |
| `"punctuatie"` | punctuation |
| `"simbol"` | symbol |
| `"necunoscut"` | unknown |

---

### `TextAnalysisSummaryDto`
Used in paginated list responses. Same as `TextAnalysisDto` but **without `tokens`**.

```json
{
  "id": 1,
  "student_id": 42,
  "raw_text": "你好世界",
  "source_type": "MANUAL",
  "overall_hsk_level": 1,
  "created_at": "2024-06-01T10:30:00",
  "translated_text": "Hello World",
  "translation_language": "en"
}
```

---

### `PageDto`
Wrapper for all paginated responses.

```json
{
  "items": [ ...TextAnalysisSummaryDto ],
  "total": 100,
  "page": 1,
  "size": 20,
  "total_pages": 5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `items` | `array` | Array of `TextAnalysisSummaryDto` |
| `total` | `integer` | Total number of records |
| `page` | `integer` | Current page (1-based) |
| `size` | `integer` | Items per page |
| `total_pages` | `integer` | Total number of pages |

---

### `StudentStatsDto`

```json
{
  "token_distribution": [
    { "hsk_level": 1, "token_count": 150 },
    { "hsk_level": 2, "token_count": 80 },
    { "hsk_level": null, "token_count": 12 }
  ],
  "source_type_split": {
    "MANUAL": 15,
    "OCR": 4
  },
  "unique_chars_per_hsk_level": [
    {
      "hsk_level": 1,
      "unique_count": 120,
      "total_in_level": 500,
      "percentage": 24.0
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `token_distribution` | `array` | How many tokens the student encountered per HSK level. `hsk_level: null` = characters not in HSK. |
| `source_type_split` | `object` | Count of `MANUAL` vs `OCR` analyses. A key may be missing if count is 0. |
| `unique_chars_per_hsk_level` | `array` | Unique Chinese characters seen per HSK level, with progress percentage out of total available in that level. |

---

### `PreviewResponseDto`

```json
{
  "tokens": [
    {
      "hanzi": "你好",
      "pinyin": "nǐ hǎo",
      "hsk_level": 1,
      "position_index": 0,
      "pos": "verb"
    }
  ]
}
```

> Preview tokens do **not** include `translation` and are **not saved** to the database.

---

## Endpoints

---

### `POST /api/analysis/text`
Analyzes a Chinese text string. Saves the result to the database.

**Request body:**
```json
{
  "raw_text": "你好世界",
  "translation_language": "en"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `raw_text` | `string` | ✅ | min length: 1 |
| `translation_language` | `string` | ❌ | `"en"` (default), `"ro"`, `"de"`, `"es"`, `"fr"` |

**Success response:** `201 Created` → `TextAnalysisDto`

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or accessing another student's data |
| `422` | Validation error (empty text, invalid language) |
| `503` | Google Translate API unavailable |

---

### `POST /api/analysis/ocr`
Extracts Chinese text from an uploaded image, then analyzes it. Saves the result to the database.

**Request:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `file` | ✅ | Image file (JPG, PNG, etc.) |
| `translation_language` | `string` | ❌ | `"en"` (default) or `"ro"` |

> ⚠️ **Important:** The first OCR request after server startup may take **30–60 seconds** while the EasyOCR model loads. Subsequent requests are fast. Consider showing a loading indicator.

**Success response:** `201 Created` → `TextAnalysisDto`

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or accessing another student's data |
| `422` | Invalid image file, unsupported format, or no Chinese text found in image |
| `503` | Google Translate API unavailable |

---

### `GET /api/analysis/student/{student_id}`
Returns a paginated list of analyses for a student. Tokens are **not** included in list items.

**Path parameter:**

| Param | Type | Description |
|-------|------|-------------|
| `student_id` | `integer` | The student's ID |

**Query parameters:**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `page` | `integer` | ❌ | `1` | min: 1 |
| `size` | `integer` | ❌ | `20` | min: 1, max: 100 |
| `source_type` | `string` | ❌ | none | `"MANUAL"` or `"OCR"` |
| `hsk_level` | `integer` | ❌ | none | 1–6 |
| `sort_order` | `string` | ❌ | `"newest"` | `"newest"` or `"oldest"` |

**Example request:**
```
GET /api/analysis/student/42?page=1&size=10&source_type=MANUAL&sort_order=newest
```

**Success response:** `200 OK` → `PageDto` (items are `TextAnalysisSummaryDto`)

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or accessing another student's data |
| `422` | Invalid query parameter values |

---

### `GET /api/analysis/student/{student_id}/stats`
Returns aggregate statistics for a student's analyses.

**Path parameter:**

| Param | Type | Description |
|-------|------|-------------|
| `student_id` | `integer` | The student's ID |

**Success response:** `200 OK` → `StudentStatsDto`

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or accessing another student's data |

> If the student has no analyses yet, all arrays will be empty and `source_type_split` will be `{}`.

---

### `GET /api/analysis/{analysis_id}`
Returns the full details of a single analysis, **including tokens**.

**Path parameter:**

| Param | Type | Description |
|-------|------|-------------|
| `analysis_id` | `integer` | The analysis ID |

**Success response:** `200 OK` → `TextAnalysisDto`

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or accessing another student's analysis |
| `404` | Analysis not found |

---

### `DELETE /api/analysis/{analysis_id}`
Deletes an analysis and all its associated tokens.

**Path parameter:**

| Param | Type | Description |
|-------|------|-------------|
| `analysis_id` | `integer` | The analysis ID to delete |

**Success response:** `204 No Content` (empty body)

**Error responses:**

| Status | When |
|--------|------|
| `403` | Teacher role or trying to delete another student's analysis |
| `404` | Analysis not found |

---

### `POST /api/analysis/preview`
Tokenizes and annotates Chinese text **without saving** to the database. Use this for a live preview before the user submits an analysis.

**Request body:**
```json
{
  "text": "你好世界"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `text` | `string` | ✅ | min length: 1 |

**Success response:** `200 OK` → `PreviewResponseDto`

> Preview does **not** call Google Translate — no translation is returned. It only returns `hanzi`, `pinyin`, `hsk_level`, `position_index`, and `pos`.

**Error responses:**

| Status | When |
|--------|------|
| `422` | Empty text |

---

## Error Response Format

All errors follow the standard FastAPI format:

```json
{
  "detail": "Error message here"
}
```

For validation errors (`422`), the format is more detailed:

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "raw_text"],
      "msg": "String should have at least 1 character",
      "input": ""
    }
  ]
}
```

---

## HSK Levels Reference

| Level | Description |
|-------|-------------|
| `1` | Beginner — 150 most common words |
| `2` | Elementary — 300 words |
| `3` | Intermediate — 600 words |
| `4` | Upper-Intermediate — 1200 words |
| `5` | Advanced — 2500 words |
| `6` | Mastery — 5000+ words |
| `null` | Character not found in HSK vocabulary |

---

## Quick Reference — All Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `POST` | `/api/analysis/text` | Analyze Chinese text | `201` `TextAnalysisDto` |
| `POST` | `/api/analysis/ocr` | Analyze image via OCR | `201` `TextAnalysisDto` |
| `GET` | `/api/analysis/student/{student_id}` | Paginated analysis list | `200` `PageDto` |
| `GET` | `/api/analysis/student/{student_id}/stats` | Student statistics | `200` `StudentStatsDto` |
| `GET` | `/api/analysis/{analysis_id}` | Single analysis with tokens | `200` `TextAnalysisDto` |
| `DELETE` | `/api/analysis/{analysis_id}` | Delete an analysis | `204` |
| `POST` | `/api/analysis/preview` | Preview tokenization (no save) | `200` `PreviewResponseDto` |