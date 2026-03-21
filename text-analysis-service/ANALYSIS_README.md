# text-analysis-service

Microserviciu responsabil pentru analiza NLP a textului chinezesc, OCR pe imagini si traducere. Opereaza independent — nu are dependente inter-servicii.

- **Port:** `8085`
- **Baza de date:** PostgreSQL — `text_analysis_database`
- **Emite JWT:** Nu — validarea JWT este responsabilitatea API Gateway
- **Swagger UI:** `http://localhost:8085/docs`

---

## Tech Stack

- Python 3.14, FastAPI, SQLAlchemy, Pydantic
- PostgreSQL, psycopg2
- jieba (tokenizare chinezesca), pypinyin (pinyin), easyocr (OCR)
- Google Translate API v2

---

## Schema bazei de date

```
text_analyses
├── id                   BIGINT PK (auto-generated)
├── student_id           BIGINT (not null)
├── raw_text             TEXT (not null)
├── source_type          VARCHAR(20) (not null) — MANUAL | OCR
├── overall_hsk_level    INTEGER (nullable)
├── created_at           DATETIME (not null, server_default=now())
├── translated_text      TEXT (nullable)
└── translation_language VARCHAR(10) (not null) — "ro" | "en"

analysis_tokens
├── id              BIGINT PK (auto-generated)
├── analysis_id     BIGINT FK → text_analyses.id (CASCADE DELETE, not null)
├── hanzi           VARCHAR(100) (not null)
├── pinyin          VARCHAR(255) (nullable)
├── translation     TEXT (nullable)
├── hsk_level       INTEGER (nullable) — 1-6, null daca nu apare in listele HSK
└── position_index  INTEGER (not null) — index dens garantat (0, 1, 2, 3...)

INDEX: idx_analysis_tokens_analysis_id ON analysis_tokens(analysis_id)
```

**Relatii:** O `TextAnalysis` contine mai multi `AnalysisToken` (CASCADE DELETE).
`position_index` este intotdeauna dens — frontul poate reconstitui ordinea tokenilor in text sortand dupa acest camp.

---

## Modele de date (DTO-uri)

### `TextAnalysisDto`
Returnat la `POST /text`, `POST /ocr` si `GET /{analysis_id}`.
Contine intotdeauna lista completa de tokeni.

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
    },
    {
      "id": 2,
      "analysis_id": 1,
      "hanzi": "世界",
      "pinyin": "shì jiè",
      "translation": "world",
      "hsk_level": 1,
      "position_index": 1
    }
  ]
}
```

### `TextAnalysisSummaryDto`
Returnat la `GET /student/{student_id}` (listare paginata).
Nu contine tokeni — frontul ii cere explicit la `GET /{analysis_id}`.

```json
{
  "id": 1,
  "student_id": 1,
  "raw_text": "你好世界",
  "source_type": "MANUAL",
  "overall_hsk_level": 1,
  "created_at": "2024-01-01T10:00:00",
  "translated_text": "Hello world",
  "translation_language": "en"
}
```

### `PageDto`
Returnat la `GET /student/{student_id}`.

```json
{
  "items": [ ],
  "total": 47,
  "page": 1,
  "size": 20,
  "total_pages": 3
}
```

> `items` contine obiecte de tip `TextAnalysisSummaryDto`.

### `StudentStatsDto`
Returnat la `GET /student/{student_id}/stats`.

```json
{
  "token_distribution": [
    { "hsk_level": 1, "token_count": 145 },
    { "hsk_level": 2, "token_count": 89 },
    { "hsk_level": 3, "token_count": 34 },
    { "hsk_level": null, "token_count": 28 }
  ],
  "source_type_split": {
    "MANUAL": 12,
    "OCR": 5
  },
  "unique_chars_per_hsk_level": [
    { "hsk_level": 1, "unique_count": 87, "total_in_level": 150, "percentage": 58.0 },
    { "hsk_level": 2, "unique_count": 34, "total_in_level": 150, "percentage": 22.67 },
    { "hsk_level": 3, "unique_count": 12, "total_in_level": 224, "percentage": 5.36 }
  ]
}
```

> `token_distribution` — cati tokeni a intalnit studentul per nivel HSK. `hsk_level: null` = tokeni care nu apar in nicio lista HSK. Util pentru bar chart / pie chart.
> `source_type_split` — cate analize MANUAL vs OCR. Util pentru donut chart.
> `unique_chars_per_hsk_level` — cate caractere distincte a intalnit studentul din totalul disponibil per nivel HSK. `percentage` = progres din vocabularul HSK. Util pentru progress bar per nivel.

### `AnalyzeTextRequestDto` (request body pentru `POST /text`)

```json
{
  "raw_text": "你好世界",
  "translation_language": "en"
}
```

> `student_id` este absent din request body — este extras din header-ul `X-User-Id` injectat de API Gateway.
> `translation_language` accepta doar `"ro"` sau `"en"`. Default: `"en"`.

---

## Endpoint-uri

### `POST /api/analysis/text`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Request body:** `AnalyzeTextRequestDto`
- **Comportament:** tokenizeaza textul cu jieba, extrage pinyin, determina nivelul HSK per token si overall, translateaza textul integral si fiecare token individual intr-un singur apel bulk.
- **Response `201`:** `TextAnalysisDto` cu tokeni populati
- **Response `403`:** TEACHER sau STUDENT care incearca sa creeze analiza pentru alt student
- **Response `503`:** Google Translate API indisponibil

---

### `POST /api/analysis/ocr`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Request:** `multipart/form-data`
  - `image`: fisier imagine (JPEG, PNG, etc.)
  - `translation_language`: `"ro"` | `"en"` (optional, default `"en"`)
- **Comportament:** extrage textul chinezesc din imagine cu EasyOCR, apoi ruleaza acelasi pipeline ca `POST /text`.
- **Response `201`:** `TextAnalysisDto` cu tokeni populati
- **Response `403`:** TEACHER sau STUDENT care incearca sa creeze analiza pentru alt student
- **Response `422`:** imaginea nu contine text chinezesc recognoscibil sau format de imagine invalid
- **Response `503`:** Google Translate API indisponibil

---

### `GET /api/analysis/student/{student_id}/stats`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Comportament:** returneaza statistici agregate pentru toate analizele studentului, indiferent de filtre.
- **Response `200`:** `StudentStatsDto`
- **Response `403`:** TEACHER sau STUDENT care incearca sa acceseze statisticile altui student

---

### `GET /api/analysis/student/{student_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Query params (toti optionali):**

| Param | Tip | Valori acceptate | Default | Descriere |
|---|---|---|---|---|
| `page` | int | >= 1 | 1 | Numarul paginii |
| `size` | int | 1-100 | 20 | Elemente per pagina |
| `source_type` | string | `MANUAL`, `OCR` | null (toate) | Filtru dupa sursa |
| `hsk_level` | int | 1-6 | null (toate) | Filtru dupa nivel HSK overall |
| `sort_order` | string | `newest`, `oldest` | `newest` | Sortare dupa data |

- **Comportament:** returneaza analizele studentului paginate si filtrate. Tokenii NU sunt inclusi in raspuns.
- **Response `200`:** `PageDto` cu `items` de tip `TextAnalysisSummaryDto`
- **Response `403`:** TEACHER sau STUDENT care incearca sa acceseze istoricul altui student

**Exemple de request:**
```
GET /api/analysis/student/1
GET /api/analysis/student/1?source_type=OCR
GET /api/analysis/student/1?hsk_level=2&sort_order=oldest
GET /api/analysis/student/1?source_type=MANUAL&hsk_level=1&page=2&size=10
```

---

### `GET /api/analysis/{analysis_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Comportament:** returneaza analiza completa cu toti tokenii. Ownership-ul este verificat intern dupa fetch — API Gateway nu poate cunoaste `student_id`-ul analizei fara un query suplimentar.
- **Response `200`:** `TextAnalysisDto` cu tokeni populati
- **Response `403`:** TEACHER sau STUDENT care incearca sa acceseze analiza altui student
- **Response `404`:** analiza nu exista

---

### `DELETE /api/analysis/{analysis_id}`
- **Autorizare:** STUDENT (own), ADMIN
- **Headers obligatorii:** `X-User-Id`, `X-User-Role`
- **Comportament:** sterge analiza si toti tokenii asociati (cascade DB). Ownership-ul este verificat intern dupa fetch.
- **Response `204`:** sters cu succes
- **Response `403`:** TEACHER sau STUDENT care incearca sa stearga analiza altui student
- **Response `404`:** analiza nu exista

---

## Autorizare per endpoint (pentru API Gateway)

| Method | Path | PUBLIC | STUDENT | TEACHER | ADMIN |
|--------|------|--------|---------|---------|-------|
| POST | /api/analysis/text | | own | | ✓ |
| POST | /api/analysis/ocr | | own | | ✓ |
| GET | /api/analysis/student/{studentId}/stats | | own | | ✓ |
| GET | /api/analysis/student/{studentId} | | own | | ✓ |
| GET | /api/analysis/{analysisId} | | own | | ✓ |
| DELETE | /api/analysis/{analysisId} | | own | | ✓ |

> **TEACHER** nu are acces la niciun endpoint al acestui serviciu.
> **own** = API Gateway verifica ca `userId` din JWT claims coincide cu `X-User-Id` header transmis serviciului.
> Ownership-ul pe `GET /{analysisId}` si `DELETE /{analysisId}` este verificat intern in service dupa fetch.
> Toate endpoint-urile necesita headerele `X-User-Id` si `X-User-Role` injectate de API Gateway.

---

## Headers injectate de API Gateway

| Header | Tip | Descriere |
|--------|-----|-----------|
| `X-User-Id` | `Long` | `userId` din JWT claims |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Coduri de eroare

| Cod | Cauza |
|-----|-------|
| `403` | Rol TEACHER sau STUDENT care acceseaza resursa altui student |
| `404` | Analiza cu ID-ul specificat nu exista |
| `422` | Imagine invalida sau fara text chinezesc detectabil |
| `503` | Google Translate API indisponibil sau timeout |

---

## Logica interna — pipeline de analiza

1. **Tokenizare** — jieba segmenteaza textul in tokeni (caractere / cuvinte), modul precis (`cut_all=False`)
2. **Pinyin** — pypinyin genereaza transliteratia cu diacritice tonale (`Style.TONE`)
3. **HSK lookup** — HskService cauta nivelul HSK din `resources/hsk_words.json` (dictionar in-memory)
4. **Overall HSK** — media aritmetica rotunjita a nivelurilor HSK ale tokenilor cu nivel cunoscut; `null` daca niciun token nu are nivel HSK
5. **Traducere bulk** — Google Translate API traduce toti tokenii intr-un singur request HTTP
6. **Traducere text integral** — Google Translate API traduce textul complet separat (traducere contextuala)
7. **Persistenta atomica** — `TextAnalysis` + `AnalysisToken[]` salvate in aceeasi tranzactie DB

> `position_index` pe fiecare token este un index dens (0, 1, 2...) — tokenii goi sau spatiile produse de jieba sunt eliminati, contorul este incrementat doar pentru tokenii valizi. Frontul poate reconstitui textul original sortand tokenii dupa `position_index`.

---

## Configurare `.env`

| Variabila | Descriere |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL complet |
| `GOOGLE_TRANSLATE_API_KEY` | Cheia API pentru Google Translate v2 |

---

## Structura pachetelor

```
text-analysis-service/
├── config/
│   └── database.py
├── controller/
│   └── analysis_controller.py
├── domain/
│   ├── analysis_token.py
│   ├── text_analysis.py
│   ├── dao/
│   │   ├── i_analysis_token_dao.py
│   │   └── i_text_analysis_dao.py
│   └── dto/
│       ├── analysis_token_dto.py
│       ├── analyze_request_dto.py
│       ├── page_dto.py
│       ├── student_stats_dto.py
│       ├── text_analysis_dto.py
│       └── text_analysis_summary_dto.py
├── repository/
│   ├── entities/
│   │   ├── analysis_token_entity.py
│   │   └── text_analysis_entity.py
│   ├── base.py
│   ├── analysis_token_dao.py
│   └── text_analysis_dao.py
├── service/
│   ├── analysis_service.py
│   ├── hsk_service.py
│   ├── nlp_service.py
│   ├── ocr_service.py
│   └── translation_service.py
├── utils/
│   └── dependencies.py
├── resources/
│   └── hsk_words.json
├── main.py
└── .env
```