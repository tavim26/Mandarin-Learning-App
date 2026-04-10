# text-analysis-service

- **Port:** `8085`
- **Baza de date:** PostgreSQL — `text_analysis_database`
- **Swagger UI:** `http://localhost:8085/docs`

---

## Headers injectate de API Gateway
Frontul NU seteaza aceste headere manual. Sunt injectate automat din JWT.

| Header | Tip | Valori |
|--------|-----|--------|
| `X-User-Id` | `Long` | userId din JWT |
| `X-User-Role` | `String` | `STUDENT` / `TEACHER` / `ADMIN` |

---

## Autorizare

| Method | Path | STUDENT | TEACHER | ADMIN |
|--------|------|---------|---------|-------|
| POST | /api/analysis/text | own | | ✓ |
| POST | /api/analysis/ocr | own | | ✓ |
| POST | /api/analysis/preview | ✓ | ✓ | ✓ |
| GET | /api/analysis/student/{studentId}/stats | own | | ✓ |
| GET | /api/analysis/student/{studentId} | own | | ✓ |
| GET | /api/analysis/{analysisId} | own | | ✓ |
| DELETE | /api/analysis/{analysisId} | own | | ✓ |

> **own** = utilizatorul poate accesa doar propriile resurse.
> Ownership-ul pe `GET /{analysisId}` si `DELETE /{analysisId}` este verificat intern dupa fetch — Gateway-ul nu il poate verifica fara un query suplimentar.
> **TEACHER** are acces doar la `/preview`.

---

## Modele de date

### `AnalysisTokenDto`
Prezent in `TextAnalysisDto` (analiza completa) si `PreviewResponseDto`.

```json
{
  "id": 1,
  "analysis_id": 1,
  "hanzi": "学习",
  "pinyin": "xué xí",
  "translation": "to study",
  "hsk_level": 2,
  "position_index": 0,
  "pos": "verb"
}
```

| Camp | Tip | Descriere |
|------|-----|-----------|
| `hanzi` | `string` | Caracterul / cuvantul chinezesc |
| `pinyin` | `string` | Transliteratie cu diacritice tonale |
| `translation` | `string` | Traducerea individuala a tokenului |
| `hsk_level` | `int / null` | Nivel HSK 1-6. `null` = nu apare in listele HSK |
| `position_index` | `int` | Index dens (0,1,2...). Sorteaza dupa el pentru a reconstitui ordinea din text |
| `pos` | `string / null` | Partea de vorbire. Vezi tabelul POS de mai jos |

**Valori posibile pentru `pos`:**

| Valoare | Semnificatie |
|---------|-------------|
| `verb` | Verb |
| `substantiv` | Substantiv |
| `adjectiv` | Adjectiv |
| `adverb` | Adverb |
| `pronume` | Pronume |
| `nume propriu` | Nume propriu |
| `numar` | Numar |
| `particula` | Particula gramaticala |
| `prepozitie` | Prepozitie |
| `conjunctie` | Conjunctie |
| `auxiliar` | Verb auxiliar |
| `interjectie` | Interjectie |
| `punctuatie` | Semn de punctuatie |
| `necunoscut` | Nedeterminat |
| `null` | Tokenul nu a putut fi clasificat |

---

### `TextAnalysisDto`
Returnat la `POST /text`, `POST /ocr`, `GET /{analysisId}`.
Contine intotdeauna lista completa de tokeni.

```json
{
  "id": 1,
  "student_id": 1,
  "raw_text": "我在学习中文",
  "source_type": "MANUAL",
  "overall_hsk_level": 2,
  "created_at": "2024-01-01T10:00:00",
  "translated_text": "I am studying Chinese",
  "translation_language": "en",
  "tokens": [ ]
}
```

| Camp | Tip | Descriere |
|------|-----|-----------|
| `source_type` | `string` | `MANUAL` = text introdus / `OCR` = extras din imagine |
| `overall_hsk_level` | `int / null` | Media nivelurilor HSK ale tokenilor. `null` daca niciun token nu are nivel HSK |
| `translation_language` | `string` | Limba in care s-a tradus: `ro`, `en`, `de`, `es`, `fr` |
| `tokens` | `array` | Lista de `AnalysisTokenDto` ordonata dupa `position_index` |

---

### `TextAnalysisSummaryDto`
Returnat in lista paginata `GET /student/{studentId}`.
**Nu contine tokeni.** Tokenii se cer separat la `GET /{analysisId}`.

```json
{
  "id": 1,
  "student_id": 1,
  "raw_text": "我在学习中文",
  "source_type": "MANUAL",
  "overall_hsk_level": 2,
  "created_at": "2024-01-01T10:00:00",
  "translated_text": "I am studying Chinese",
  "translation_language": "en"
}
```

---

### `PageDto`
Returnat la `GET /student/{studentId}`.

```json
{
  "items": [ ],
  "total": 47,
  "page": 1,
  "size": 20,
  "total_pages": 3
}
```

> `items` = lista de `TextAnalysisSummaryDto`

---

### `StudentStatsDto`
Returnat la `GET /student/{studentId}/stats`.

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

| Camp | Utilizare recomandata in front |
|------|-------------------------------|
| `token_distribution` | Bar chart / pie chart per nivel HSK |
| `source_type_split` | Donut chart MANUAL vs OCR |
| `unique_chars_per_hsk_level` | Progress bar per nivel HSK. `percentage` = % din vocabularul total al nivelului |

> `hsk_level: null` in `token_distribution` = tokeni care nu apar in nicio lista HSK 1-6.

---

### `PreviewResponseDto`
Returnat la `POST /preview`. Nu se salveaza nimic in DB.

```json
{
  "tokens": [
    { "hanzi": "学习", "pinyin": "xué xí", "hsk_level": 2, "position_index": 0, "pos": "verb" },
    { "hanzi": "中文", "pinyin": "zhōng wén", "hsk_level": 2, "position_index": 1, "pos": "substantiv" }
  ]
}
```

---

## Endpoint-uri

---

### `POST /api/analysis/text`
Analizeaza text chinezesc introdus manual.

**Request body:**
```json
{
  "raw_text": "我在学习中文",
  "translation_language": "en"
}
```

| Camp | Obligatoriu | Valori acceptate | Default |
|------|-------------|-----------------|---------|
| `raw_text` | Da | orice string chinezesc | — |
| `translation_language` | Nu | `ro`, `en`, `de`, `es`, `fr` | `en` |

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `201` | `TextAnalysisDto` cu tokeni populati |
| `403` | STUDENT incearca sa creeze analiza pentru alt student |
| `503` | Google Translate API indisponibil |

---

### `POST /api/analysis/ocr`
Extrage si analizeaza text chinezesc dintr-o imagine.

**Request:** `multipart/form-data`

| Camp | Tip | Obligatoriu | Descriere |
|------|-----|-------------|-----------|
| `image` | file | Da | JPEG, PNG, etc. |
| `translation_language` | string | Nu | `ro`, `en`, `de`, `es`, `fr`. Default: `en` |

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `201` | `TextAnalysisDto` cu tokeni populati |
| `403` | STUDENT incearca sa creeze analiza pentru alt student |
| `422` | Imagine invalida sau fara text chinezesc detectabil |
| `503` | Google Translate API indisponibil |

---

### `POST /api/analysis/preview`
Returneaza pinyin + POS + HSK pentru orice string chinezesc.
**Nu salveaza nimic in DB. Nu apeleaza Google Translate.**
Accesibil pentru toate rolurile autentificate.

**Request body:**
```json
{
  "text": "学习"
}
```

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `200` | `PreviewResponseDto` |

**Utilizare tipica in front:**
- Click pe un caracter dintr-un exercitiu → afiseaza pinyin + POS + nivel HSK intr-un tooltip
- Hover pe orice text chinezesc din interfata

---

### `GET /api/analysis/student/{studentId}/stats`
Statistici agregate pentru toate analizele studentului.

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `200` | `StudentStatsDto` |
| `403` | STUDENT incearca sa acceseze statisticile altui student |

---

### `GET /api/analysis/student/{studentId}`
Lista paginata a analizelor unui student. Tokenii nu sunt inclusi.

**Query params:**

| Param | Tip | Valori | Default | Descriere |
|-------|-----|--------|---------|-----------|
| `page` | int | >= 1 | `1` | Numarul paginii |
| `size` | int | 1-100 | `20` | Elemente per pagina |
| `source_type` | string | `MANUAL`, `OCR` | null | Filtru dupa sursa |
| `hsk_level` | int | 1-6 | null | Filtru dupa nivel HSK overall |
| `sort_order` | string | `newest`, `oldest` | `newest` | Sortare dupa data |

**Exemple:**
```
GET /api/analysis/student/1
GET /api/analysis/student/1?source_type=OCR
GET /api/analysis/student/1?hsk_level=2&sort_order=oldest
GET /api/analysis/student/1?source_type=MANUAL&page=2&size=10
```

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `200` | `PageDto` cu `items` de tip `TextAnalysisSummaryDto` |
| `403` | STUDENT incearca sa acceseze istoricul altui student |

---

### `GET /api/analysis/{analysisId}`
Analiza completa cu toti tokenii.

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `200` | `TextAnalysisDto` cu tokeni populati |
| `403` | STUDENT incearca sa acceseze analiza altui student |
| `404` | Analiza nu exista |

---

### `DELETE /api/analysis/{analysisId}`
Sterge analiza si toti tokenii asociati.

**Raspunsuri:**
| Cod | Cauza |
|-----|-------|
| `204` | Sters cu succes |
| `403` | STUDENT incearca sa stearga analiza altui student |
| `404` | Analiza nu exista |

---

## Coduri de eroare — sumar

| Cod | Cauza generala |
|-----|---------------|
| `403` | Rol TEACHER (unde nu are acces) sau STUDENT care acceseaza resursa altui student |
| `404` | Resursa cu ID-ul specificat nu exista |
| `422` | Imagine invalida sau fara text chinezesc detectabil |
| `503` | Google Translate API indisponibil sau timeout |