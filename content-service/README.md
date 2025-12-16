# Content Service - Chinese Learning Platform

Acest microserviciu este responsabil de gestionarea continutului educational al platformei (Unitati de curs, Lectii, Materiale si Exercitii).

## 1. Stack Tehnologic

* **Limbaj:** Java 21 (Amazon Corretto / OpenJDK 21)
* **Framework:** Spring Boot 4.0.0
* **Baza de Date:** PostgreSQL 16+
* **ORM:** Hibernate 6 (JPA)
* **Build Tool:** Maven
* **Documentatie API:** SpringDoc OpenAPI (Swagger UI)
* **Format Date:** JSON

## 2. Arhitectura si Structura Proiectului

Proiectul urmeaza o arhitectura stratificata clasica (N-Tier Architecture).

### Pachete Principale:
* `com.chineselearning.contentservice.domain` -> Entitatile JPA (baza de date).
* `com.chineselearning.contentservice.domain.dao` -> Interfete Repository (extind `JpaRepository`).
* `com.chineselearning.contentservice.domain.dto` -> Obiecte de transfer (Request/Response) pentru API.
* `com.chineselearning.contentservice.service` -> Logica de business, tranzactii si mapare (Entity <-> DTO).
* `com.chineselearning.contentservice.controller` -> Endpoint-uri REST si documentatie Swagger.

### Reguli Stricte de Implementare (Context pentru AI):
1.  **Fara Lombok:** Toate Getters, Setters si Constructorii sunt generati manual.
2.  **Fara MapStruct/ModelMapper:** Maparea dintre Entity si DTO se face manual in Service layer (metode helper private).
3.  **Fara Diacritice:** Codul sursa, comentariile si documentatia Swagger NU contin diacritice.
4.  **Database First/Code First:** Tabelele sunt generate automat de Hibernate (`ddl-auto=update`), dar structura este controlata prin adnotari JPA.

## 3. Baza de Date (Schema)

Nume baza de date: `content_database`
Credentiale locale: `postgres` / `admin`

### Tabele:

1.  **`course_units`**
    * `id` (PK, Auto-inc)
    * `title`, `description`
    * `hsk_level` (int)
    * `order_index` (int - pentru ordonarea in UI)

2.  **`lessons`**
    * `id` (PK, Auto-inc)
    * `unit_id` (FK -> course_units)
    * `title`, `description`
    * `xp_reward` (int)
    * `order_index` (int)

3.  **`lesson_materials`**
    * `id` (PK, Auto-inc)
    * `lesson_id` (FK -> lessons)
    * `type` (String: VIDEO, PDF, LINK)
    * `url` (String)

4.  **`exercises`** (Cheie pentru flexibilitate)
    * `id` (PK, Auto-inc)
    * `lesson_id` (FK -> lessons)
    * `type` (String: MULTIPLE_CHOICE, TRANSLATION, MATCHING)
    * `difficulty` (int)
    * **`content_data`** (`jsonb`): Stocheaza structura dinamica a exercitiului.

### Detaliu Tehnic JSONB
Pentru tabela `exercises`, folosim tipul nativ PostgreSQL `jsonb` mapat prin Hibernate 6:
```java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "content_data", columnDefinition = "jsonb")
private Map<String, Object> contentData;

```
### 4. API si Documentatie
Serverul ruleaza pe portul: 8081 Swagger UI: http://localhost:8081/swagger-ui/index.html

Endpoint-uri Principale:
Toate rutele incep cu /api/content.

Course Units:

GET /units (Toate unitatile)

POST /units (Creare)

PUT /units/{id} (Update)

DELETE /units/{id} (Stergere)

Lessons:

GET /units/{unitId}/lessons (Lectiile dintr-un modul)

GET /lessons/{id} (Detalii lectie)

POST /lessons

PUT /lessons/{id}

Exercises:

GET /lessons/{lessonId}/exercises

POST /exercises (Accepta JSON arbitrar in campul contentData)

PUT /exercises/{id}