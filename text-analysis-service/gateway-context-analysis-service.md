# API Gateway — Context text-analysis-service

## text-analysis-service

**Port:** 8085
**JWT emitter:** NU

### Endpoint-uri si autorizare

| Metoda | Endpoint | Autorizare |
|---|---|---|
| POST | `/api/analysis/text` | STUDENT |
| POST | `/api/analysis/ocr` | STUDENT |
| GET | `/api/analysis/student/{student_id}` | STUDENT (doar propriile analize) |
| GET | `/api/analysis/{analysis_id}` | STUDENT (doar propriile analize) |
| DELETE | `/api/analysis/{analysis_id}` | STUDENT (doar propriile analize) |

### Note de autorizare

- Toate endpoint-urile sunt accesibile exclusiv studentilor autentificati
- `student_id` trebuie extras din JWT-ul validat de Gateway si comparat cu resursa solicitata — un student nu poate accesa analizele altui student
- Nu exista endpoint-uri publice
- Nu exista endpoint-uri rezervate ADMIN sau TEACHER