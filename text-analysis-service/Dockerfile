# ===== BUILD STAGE =====
# stage separat pentru compilarea dependintelor native (spacy-pkuseg)
FROM python:3.12-slim AS build

WORKDIR /app

# gcc si g++ sunt necesare pentru compilarea spacy-pkuseg pe Linux
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# copiere requirements si instalare dependinte
# acest layer este cache-uit — se reinstaleaza doar daca requirements.txt se schimba
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# descarcarea modelului spaCy in imaginea de build
# modelul este instalat ca pachet Python in site-packages
RUN python -m spacy download zh_core_web_md


# ===== RUNTIME STAGE =====
FROM python:3.12-slim

WORKDIR /app

# copiere pachete Python compilate si binare din build stage
# imaginea finala nu contine gcc/g++ — mai mica si mai sigura
COPY --from=build /usr/local/lib/python3.12/site-packages \
                  /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

# copiere cod sursa
COPY . .

# .env NU este copiat in container
# variabilele de mediu sunt injectate la runtime prin docker-compose sau docker run
RUN rm -f .env

EXPOSE 8085

# EasyOCR isi descarca modelul ch_sim la primul apel OCR (lazy init)
# nu este necesar niciun pas suplimentar aici
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8085"]