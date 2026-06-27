# Content Service — Documentație API pentru Frontend

## Cuprins
1. [Prezentare generală](#1-prezentare-generală)
2. [Base URL](#2-base-url)
3. [Headere comune](#3-headere-comune)
4. [Modele de date](#4-modele-de-date)
5. [Endpoints — Course Units](#5-endpoints--course-units)
6. [Endpoints — Lessons](#6-endpoints--lessons)
7. [Endpoints — Materials & File Upload](#7-endpoints--materials--file-upload)
8. [Endpoints — Exercises](#8-endpoints--exercises)
9. [Endpoints — Statistics](#9-endpoints--statistics)
10. [Coduri HTTP](#10-coduri-http)

---

## 1. Prezentare generală

Microserviciul **Content Service** gestionează structura de conținut educațional al platformei:

```
CourseUnit (capitol)
  └── Lesson (lecție)
        ├── Exercise (exercițiu)
        └── LessonMaterial (resursă: PDF, audio, video etc.)
```

Documentația interactivă Swagger este disponibilă la:
```
http://localhost:8081/swagger-ui/index.html
```

---

## 2. Base URL

```
http://localhost:8081/api/content
```

---

## 3. Headere comune

Toate requesturile cu body JSON trebuie să includă:
```
Content-Type: application/json
```

Operațiile care identifică un profesor (creare unitate) necesită:
```
X-User-Id: <id-ul profesorului ca număr întreg>
```

---

## 4. Modele de date

### CourseUnitDto
Reprezintă un capitol/modul al cursului.

| Câmp | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `id` | `Long` | — (generat) | Identificator unic |
| `title` | `String` | ✅ | Titlul unității |
| `description` | `String` | ❌ | Descriere opțională |
| `hskLevel` | `Integer` | ❌ | Nivelul HSK (1–6) |
| `orderIndex` | `Integer` | ✅ | Ordinea de afișare |
| `createdByTeacherId` | `Long` | — (setat din header) | ID-ul profesorului creator |

```json
{
  "id": 1,
  "title": "Salutări și prezentări",
  "description": "Vocabular de bază pentru conversații introductive.",
  "hskLevel": 1,
  "orderIndex": 1,
  "createdByTeacherId": 42
}
```

---

### LessonDto
Reprezintă o lecție din cadrul unei unități.

| Câmp | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `id` | `Long` | — (generat) | Identificator unic |
| `unitId` | `Long` | ✅ | ID-ul unității părinte |
| `title` | `String` | ✅ | Titlul lecției |
| `description` | `String` | ❌ | Descriere opțională |
| `xpReward` | `Integer` | ✅ | XP acordat la finalizare |
| `orderIndex` | `Integer` | ✅ | Ordinea de afișare în unitate |
| `exercises` | `ExerciseDto[]` | — | Populat **doar** la `GET /lessons/{id}`. În listele de lecții acest câmp este `null`. |

```json
{
  "id": 5,
  "unitId": 1,
  "title": "Cum te numești?",
  "description": "Întrebări și răspunsuri despre identitate.",
  "xpReward": 100,
  "orderIndex": 2,
  "exercises": null
}
```

> **Notă:** `exercises` este populat exclusiv când soliciți o lecție individuală prin `GET /lessons/{id}`. În toate celelalte contexte (liste) câmpul este `null` — nu trata absența lui ca eroare.

---

### ExerciseDto
Reprezintă un exercițiu dintr-o lecție.

| Câmp | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `id` | `Long` | — (generat) | Identificator unic |
| `lessonId` | `Long` | ✅ | ID-ul lecției părinte |
| `type` | `String` | ✅ | Tipul exercițiului (ex. `"MULTIPLE_CHOICE"`, `"FILL_IN_THE_BLANK"`) |
| `prompt` | `String` | ✅ | Textul întrebării/cerinței afișate utilizatorului |
| `difficulty` | `Integer` | ❌ | Nivelul de dificultate |
| `contentData` | `Object` | ❌ | JSON flexibil cu datele specifice tipului de exercițiu (răspunsuri, variante etc.) |

```json
{
  "id": 12,
  "lessonId": 5,
  "type": "MULTIPLE_CHOICE",
  "prompt": "Cum se spune 'bună ziua' în chineză?",
  "difficulty": 1,
  "contentData": {
    "options": ["你好", "再见", "谢谢", "对不起"],
    "correctAnswer": "你好"
  }
}
```

> **Notă:** Structura câmpului `contentData` variază în funcție de `type`. Frontendulul trebuie să interpreteze și să randeze `contentData` în funcție de valoarea lui `type`.

---

### LessonMaterialDto
Reprezintă o resursă atașată unei lecții (fișier, link etc.).

| Câmp | Tip | Obligatoriu | Descriere |
|---|---|---|---|
| `id` | `Long` | — (generat) | Identificator unic |
| `lessonId` | `Long` | ✅ | ID-ul lecției părinte |
| `title` | `String` | ✅ | Titlul resursei afișat utilizatorului |
| `type` | `String` | ✅ | Tipul resursei (ex. `"PDF"`, `"AUDIO"`, `"VIDEO"`, `"LINK"`) |
| `url` | `String` | ✅ | URL-ul resursei (intern sau extern) |

```json
{
  "id": 3,
  "lessonId": 5,
  "title": "Ghid pronunție tonuri",
  "type": "PDF",
  "url": "http://localhost:8081/api/content/files/uuid_ghid.pdf"
}
```

---

### CourseUnitFullDto
Returnată de `GET /units/{id}/full`. Conține unitatea împreună cu lecțiile sale (fără exerciții).

| Câmp | Tip | Descriere |
|---|---|---|
| `id` | `Long` | Identificator unic |
| `title` | `String` | Titlul unității |
| `description` | `String` | Descriere opțională |
| `hskLevel` | `Integer` | Nivelul HSK |
| `orderIndex` | `Integer` | Ordinea de afișare |
| `lessons` | `LessonDto[]` | Lecțiile unității (câmpul `exercises` este `null` în fiecare) |

---

### UnitXpStatsDto

| Câmp | Tip | Descriere |
|---|---|---|
| `unitId` | `Long` | ID-ul unității |
| `totalXp` | `Integer` | Suma XP din toate lecțiile unității |

```json
{ "unitId": 1, "totalXp": 850 }
```

---

### UnitLessonCountDto

| Câmp | Tip | Descriere |
|---|---|---|
| `unitId` | `Long` | ID-ul unității |
| `totalLessons` | `Integer` | Numărul total de lecții din unitate |

```json
{ "unitId": 1, "totalLessons": 8 }
```

---

### LessonExerciseTypesDto

| Câmp | Tip | Descriere |
|---|---|---|
| `lessonId` | `Long` | ID-ul lecției |
| `exerciseTypes` | `Object` | Map cu tipul exercițiului ca cheie și numărul de apariții ca valoare |

```json
{
  "lessonId": 5,
  "exerciseTypes": {
    "MULTIPLE_CHOICE": 4,
    "FILL_IN_THE_BLANK": 2,
    "TRANSLATION": 3
  }
}
```

---

## 5. Endpoints — Course Units

### Obține toate unitățile
```
GET /units
```
**Query params opționali:**

| Param | Tip | Descriere |
|---|---|---|
| `hskLevel` | `Integer` | Filtrează după nivel HSK |

**Răspuns `200`:** `CourseUnitDto[]` — ordonat după `orderIndex`

```
GET /units
GET /units?hskLevel=1
```

---

### Obține o unitate după ID
```
GET /units/{id}
```
**Răspuns `200`:** `CourseUnitDto`
**Răspuns `404`:** unitatea nu există

---

### Obține o unitate cu toate lecțiile sale
```
GET /units/{id}/full
```
**Răspuns `200`:** `CourseUnitFullDto` — include lista de lecții (fără exerciții)
**Răspuns `404`:** unitatea nu există

---

### Obține unitățile unui profesor
```
GET /units/teacher/{teacherId}
```
**Răspuns `200`:** `CourseUnitDto[]`

---

### Creează o unitate nouă
```
POST /units
```
**Header obligatoriu:** `X-User-Id: <teacherId>`

**Body:** `CourseUnitDto` (fără `id` și `createdByTeacherId`)
```json
{
  "title": "Salutări și prezentări",
  "description": "Vocabular introductiv.",
  "hskLevel": 1,
  "orderIndex": 1
}
```
**Răspuns `201`:** `CourseUnitDto` cu `id` generat
**Răspuns `400`:** `title` lipsă sau `orderIndex` lipsă

---

### Actualizează o unitate
```
PUT /units/{id}
```
**Body:** `CourseUnitDto` (fără `id`)
```json
{
  "title": "Titlu actualizat",
  "description": "Descriere nouă.",
  "hskLevel": 1,
  "orderIndex": 2
}
```
**Răspuns `200`:** `CourseUnitDto` actualizat
**Răspuns `400`:** `title` lipsă
**Răspuns `404`:** unitatea nu există

---

### Șterge o unitate
```
DELETE /units/{id}
```
> **Atenție:** șterge cascadat toate lecțiile, exercițiile și materialele asociate.

**Răspuns `204`:** șters cu succes
**Răspuns `404`:** unitatea nu există

---

## 6. Endpoints — Lessons

### Obține lecțiile unei unități
```
GET /units/{unitId}/lessons
```
**Răspuns `200`:** `LessonDto[]` — ordonat după `orderIndex`, câmpul `exercises` este `null`

---

### Obține o lecție după ID (cu exerciții)
```
GET /lessons/{id}
```
**Răspuns `200`:** `LessonDto` — câmpul `exercises` este **populat**
**Răspuns `404`:** lecția nu există

---

### Creează o lecție
```
POST /lessons
```
**Body:** `LessonDto` (fără `id`)
```json
{
  "unitId": 1,
  "title": "Cum te numești?",
  "description": "Introducere în prezentări.",
  "xpReward": 100,
  "orderIndex": 1
}
```
**Răspuns `201`:** `LessonDto` cu `id` generat
**Răspuns `400`:** câmpuri obligatorii lipsă (`unitId`, `title`, `orderIndex`)
**Răspuns `404`:** `unitId` nu există

---

### Actualizează o lecție
```
PUT /lessons/{id}
```
**Body:** `LessonDto` (fără `id`)
```json
{
  "unitId": 1,
  "title": "Titlu actualizat",
  "xpReward": 150,
  "orderIndex": 2
}
```
**Răspuns `200`:** `LessonDto` actualizat
**Răspuns `400`:** `title` lipsă
**Răspuns `404`:** lecția nu există

---

### Șterge o lecție
```
DELETE /lessons/{id}
```
> **Atenție:** șterge cascadat toate exercițiile și materialele asociate.

**Răspuns `204`:** șters cu succes
**Răspuns `404`:** lecția nu există

---

## 7. Endpoints — Materials & File Upload

### Obține materialele unei lecții
```
GET /lessons/{lessonId}/materials
```
**Răspuns `200`:** `LessonMaterialDto[]`

---

### Adaugă un material la o lecție
```
POST /materials
```
Folosit pentru a atașa un URL (deja existent) la o lecție — fie un link extern, fie un URL obținut în prealabil prin upload.

**Body:** `LessonMaterialDto` (fără `id`)
```json
{
  "lessonId": 5,
  "title": "Ghid pronunție",
  "type": "PDF",
  "url": "http://localhost:8081/api/content/files/uuid_ghid.pdf"
}
```
**Răspuns `201`:** `LessonMaterialDto` cu `id` generat
**Răspuns `400`:** câmpuri obligatorii lipsă (`lessonId`, `title`, `type`, `url`)
**Răspuns `404`:** `lessonId` nu există

---

### Șterge un material
```
DELETE /materials/{id}
```
Șterge înregistrarea din baza de date și fișierul de pe disk (dacă e un fișier intern).

**Răspuns `204`:** șters cu succes
**Răspuns `404`:** materialul nu există

---

### Încarcă un fișier pe server
```
POST /materials/upload
Content-Type: multipart/form-data
```
**Flux recomandat:** întâi încarci fișierul cu acest endpoint, primești URL-ul, apoi creezi materialul cu `POST /materials` folosind URL-ul primit.

**Form field:**

| Field | Tip | Descriere |
|---|---|---|
| `file` | `File` | Fișierul de încărcat |

**Tipuri de fișiere acceptate:**

| Tip MIME | Extensii |
|---|---|
| `image/jpeg` | `.jpg`, `.jpeg` |
| `image/png` | `.png` |
| `image/gif` | `.gif` |
| `application/pdf` | `.pdf` |
| `application/msword` | `.doc` |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `.docx` |
| `audio/mpeg` | `.mp3` |
| `audio/wav` | `.wav` |
| `video/mp4` | `.mp4` |

**Dimensiune maximă:** 50MB

**Răspuns `201`:** `String` — URL-ul fișierului încărcat
```
http://localhost:8081/api/content/files/550e8400-e29b-41d4_ghid.pdf
```
**Răspuns `400`:** tip de fișier nepermis sau depășire limită de dimensiune
**Răspuns `500`:** eroare la scriere pe disk

---

### Servește un fișier încărcat
```
GET /files/{fileName}
```
Returnează conținutul binar al fișierului cu `Content-Type` corespunzător. Folosit direct ca `src` în `<img>`, `<audio>`, `<video>` sau ca href pentru download.

**Răspuns `200`:** conținut binar cu headerul `Content-Type` setat automat
**Răspuns `404`:** fișierul nu există

---

## 8. Endpoints — Exercises

### Obține un exercițiu după ID
```
GET /exercises/{id}
```
**Răspuns `200`:** `ExerciseDto`
**Răspuns `404`:** exercițiul nu există

---

### Obține exercițiile unei lecții
```
GET /lessons/{lessonId}/exercises
```
**Răspuns `200`:** `ExerciseDto[]`

---

### Adaugă un exercițiu
```
POST /exercises
```
**Body:** `ExerciseDto` (fără `id`)
```json
{
  "lessonId": 5,
  "type": "MULTIPLE_CHOICE",
  "prompt": "Cum se spune 'bună ziua' în chineză?",
  "difficulty": 1,
  "contentData": {
    "options": ["你好", "再见", "谢谢", "对不起"],
    "correctAnswer": "你好"
  }
}
```
**Răspuns `201`:** `ExerciseDto` cu `id` generat
**Răspuns `400`:** câmpuri obligatorii lipsă (`lessonId`, `type`, `prompt`)
**Răspuns `404`:** `lessonId` nu există

---

### Actualizează un exercițiu
```
PUT /exercises/{id}
```
**Body:** `ExerciseDto` (fără `id` și `lessonId`)
```json
{
  "type": "MULTIPLE_CHOICE",
  "prompt": "Prompt actualizat.",
  "difficulty": 2,
  "contentData": { ... }
}
```
**Răspuns `200`:** `ExerciseDto` actualizat
**Răspuns `400`:** `type` sau `prompt` lipsă
**Răspuns `404`:** exercițiul nu există

---

### Șterge un exercițiu
```
DELETE /exercises/{id}
```
**Răspuns `204`:** șters cu succes
**Răspuns `404`:** exercițiul nu există

---

## 9. Endpoints — Statistics

### XP total al unei unități
```
GET /units/{id}/stats/xp
```
Suma valorilor `xpReward` din toate lecțiile unității.

**Răspuns `200`:** `UnitXpStatsDto`
**Răspuns `404`:** unitatea nu există

---

### Numărul de lecții al unei unități
```
GET /units/{id}/stats/lessons
```
**Răspuns `200`:** `UnitLessonCountDto`
**Răspuns `404`:** unitatea nu există

---

### Tipuri de exerciții dintr-o lecție
```
GET /lessons/{id}/stats/exercise-types
```
Util pentru a randa un pie chart cu distribuția tipurilor de exerciții.

**Răspuns `200`:** `LessonExerciseTypesDto`
**Răspuns `404`:** lecția nu există

---

## 10. Coduri HTTP

| Cod | Semnificație | Când apare |
|---|---|---|
| `200 OK` | Succes | GET și PUT reușite |
| `201 Created` | Creat cu succes | POST reușit — body conține resursa creată |
| `204 No Content` | Șters cu succes | DELETE reușit — body gol |
| `400 Bad Request` | Date invalide | Câmpuri obligatorii lipsă sau tip de fișier nepermis |
| `404 Not Found` | Resursă inexistentă | ID invalid sau resursă ștearsă |
| `500 Internal Server Error` | Eroare server | Eroare la scrierea fișierului pe disk |