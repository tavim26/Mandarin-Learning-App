# text-analysis-service

Microserviciu responsabil pentru analiza NLP a textului chinezesc, OCR pe imagini si traducere. Opereaza independent — nu are dependente inter-servicii.

- **Port:** `8085`
- **Baza de date:** PostgreSQL — `text_analysis_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8085/docs`

---

## Tech Stack

- Python 3.12, FastAPI, SQLAlchemy, Pydantic
- PostgreSQL, psycopg2
- jieba (tokenizare chinezesca), pypinyin (pinyin), easyocr (OCR)
- Google Translate API v2

---

## Schema bazei de date

```
text_analyses
├── id                  BIGINT PK (auto-generated)
├── student_id          BIGINT (not null)
├── raw_text            TEXT (not null)
├── source_type         VARCHAR(20) (not null) — MANUAL | OCR
├── overall_hsk_level   INTEGER (nullable)
├── created_at          DATETIME (not null, server_default=now())
├── translated_text     TEXT (nullable)
└── translation_language VARCHAR(10) (nullable) — "ro" | "en"

analysis_tokens
├── id              BIGINT PK (auto-generated)
├── analysis_id     BIGINT FK → text_analyses.id (CASCADE DELETE, not null)
├── hanzi           VARCHAR(100) (not null)
├── pinyin          VARCHAR(255) (nullable)
├── translation     TEXT (nullable)
├── hsk_level       INTEGER (nullable) — 1-6, null daca nu apare in listele HSK
└── position_index  INTEGER (not null) — index dens (0,1,2...), fara gaps

INDEX: idx_analysis_tokens_analysis_id ON analysis_tokens(analysis_id)
```

**Relatii:** O `TextAnalysis` contine mai multi `AnalysisToken` (CASCADE DELETE).
`position_index` este intotdeauna dens (0, 1, 2, 3...) — garantat la nivel de service.

---

## Modele de date (DTO-uri)

### `TextAnalysisDto`
```json
{
  "id": 1,
  "student_id": 1,
  "raw_text": "你好世界",
  "source_type": "MANUAL",
  "overall_hsk_level": 1,
  "created_at": "2024-01-01T10:00:00",
  "translated_text": "Hello world",
  "translation_language": "en",
  "tokens": [
    {
      "id": 1,
      "analysis_id": 1,
      "hanzi": "你好",
      "pinyin": "nǐ hǎo",
      "translation": "hello",
      "hsk_level": 1,
      "position_index": 0
    }
  ]
}
```

> `overall_hsk_level` este media ponderata a nivelurilor HSK ale tokenilor din analiza.
> `tokens` este intotdeauna populat in raspuns — nu exista endpoint care sa returneze analiza fara tokeni.

### `AnalysisTokenDto`
```json
{
  "id": 1,
  "analysis_id": 1,
  "hanzi": "你好",
  "pinyin": "nǐ hǎo",
  "translation": "hello",
  "hsk_level": 1,
  "position_index": 0
}
```

### `AnalyzeTextRequestDto` (request body pentru POST /text)
```json
{
  "raw_text": "你好世界",
  "translation_language": "en"
}
```

> `student_id` este absent din request body — este extras din header-ul `X-User-Id`.
> `translation_language` accepta doar `"ro"` sau `"en"`. Default: `"en"`.

---

## Endpoint-uri

### `POST /api/analysis/text`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Request body:** `AnalyzeTextRequestDto`
- **Comportament:** tokenizeaza textul cu jieba, extrage pinyin, determina nivelul HSK per token si overall, translateaza textul integral si fiecare token individual.
- **Response `201`:** `TextAnalysisDto`
- **Response `403`:** TEACHER sau STUDENT care incearca sa creeze analiza pentru alt student
- **Response `503`:** Google Translate API indisponibil

---

### `POST /api/analysis/ocr`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Request:** `multipart/form-data`
  - `image`: fisier imagine (JPEG, PNG, etc.)
  - `translation_language`: `"ro"` | `"en"` (optional, default `"en"`)
- **Comportament:** extrage textul chinezesc din imagine cu EasyOCR, apoi ruleaza acelasi pipeline ca `/text`.
- **Response `201`:** `TextAnalysisDto`
- **Response `403`:** TEACHER sau STUDENT care incearca sa creeze analiza pentru alt student
- **Response `422`:** imaginea nu contine text chinezesc recognoscibil sau format invalid
- **Response `503`:** Google Translate API indisponibil

---

### `GET /api/analysis/student/{student_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** lista de `TextAnalysisDto` ordonata dupa `created_at` descrescator
- **Response `403`:** TEACHER sau STUDENT care incearca sa acceseze datele altui student

---

### `GET /api/analysis/{analysis_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `200`:** `TextAnalysisDto`
- **Response `403`:** TEACHER sau STUDENT care incearca sa acceseze analiza altui student
- **Response `404`:** analiza nu exista

---

### `DELETE /api/analysis/{analysis_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Response `204`:** sters cu succes (cascade: toti tokenii asociati)
- **Response `403`:** TEACHER sau STUDENT care incearca sa stearga analiza altui student
- **Response `404`:** analiza nu exista

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path                              | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|-----------------------------------|--------|---------|---------|-------|
| POST   | /api/analysis/text                |        | own     |         | ✓     |
| POST   | /api/analysis/ocr                 |        | own     |         | ✓     |
| GET    | /api/analysis/student/{studentId} |        | own     |         | ✓     |
| GET    | /api/analysis/{analysisId}        |        | own     |         | ✓     |
| DELETE | /api/analysis/{analysisId}        |        | own     |         | ✓     |

> **own** = API Gateway verifica daca `userId` din JWT claims coincide cu `X-User-Id` header transmis.
> **TEACHER** nu are acces la niciun endpoint al acestui serviciu.
> Ownership-ul pe `GET /{analysisId}` si `DELETE /{analysisId}` este verificat intern in service dupa fetch — API Gateway nu poate cunoaste `student_id`-ul analizei fara un query.

---

## Headers injectate de API Gateway

| Header        | Tip      | Descriere                        |
|---------------|----------|----------------------------------|
| `X-User-Id`   | `Long`   | `userId` din JWT claims          |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN`  |

---

## Logica interna — pipeline de analiza

1. **Tokenizare** — jieba segmenteaza textul in tokens (caractere / cuvinte)
2. **Pinyin** — pypinyin genereaza transliteratia cu diacritice tonale (Style.TONE)
3. **HSK lookup** — HskService cauta nivelul HSK din `resources/hsk_words.json` (in-memory)
4. **Overall HSK** — media ponderata a nivelurilor HSK ale tokenilor cu nivel cunoscut
5. **Traducere bulk** — Google Translate API traduce toti tokenii intr-un singur request
6. **Traducere text integral** — Google Translate API traduce textul complet separat
7. **Persistenta atomica** — `TextAnalysis` + `AnalysisToken[]` salvate in aceeasi tranzactie

---

## Coduri de eroare

| Cod | Cauza |
|-----|-------|
| `403` | Rol TEACHER sau STUDENT care acceseaza resursa altui student |
| `404` | Analiza cu ID-ul specificat nu exista |
| `422` | Imagine invalida sau fara text chinezesc detectabil |
| `503` | Google Translate API indisponibil sau timeout |

---

## Configurare `.env`

| Variabila                  | Descriere                                      |
|----------------------------|------------------------------------------------|
| `DATABASE_URL`             | Connection string PostgreSQL                   |
| `GOOGLE_TRANSLATE_API_KEY` | Cheia API pentru Google Translate v2           |

---

## Structura pachetelor

```
text-analysis-service/
├── config/
│   └── database.py             (engine, SessionLocal, get_db)
├── controller/
│   └── analysis_controller.py  (router FastAPI, verificare ownership)
├── domain/
│   ├── analysis_token.py       (dataclass AnalysisToken)
│   ├── text_analysis.py        (dataclass TextAnalysis)
│   ├── dao/
│   │   ├── i_analysis_token_dao.py
│   │   └── i_text_analysis_dao.py
│   └── dto/
│       ├── analysis_token_dto.py
│       ├── analyze_request_dto.py
│       └── text_analysis_dto.py
├── repository/
│   ├── entities/
│   │   ├── analysis_token_entity.py
│   │   └── text_analysis_entity.py
│   ├── base.py
│   ├── analysis_token_dao.py
│   └── text_analysis_dao.py
├── service/
│   ├── analysis_service.py     (pipeline principal, tranzactie atomica)
│   ├── hsk_service.py          (lookup HSK din JSON in-memory)
│   ├── nlp_service.py          (jieba + pypinyin)
│   ├── ocr_service.py          (easyocr, lazy init)
│   └── translation_service.py  (Google Translate API v2)
├── utils/
│   └── dependencies.py         (dependency injection FastAPI)
├── resources/
│   └── hsk_words.json          (dictionar hanzi -> nivel HSK)
├── main.py
└── .env
```