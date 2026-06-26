# ===== BUILD STAGE =====
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
RUN python -m spacy download zh_core_web_md


# ===== RUNTIME STAGE =====
FROM python:3.12-slim

WORKDIR /app

# copiere pachete Python compilate din build stage
COPY --from=build /usr/local/lib/python3.12/site-packages \
                  /usr/local/lib/python3.12/site-packages

# copiere doar binarele necesare din build stage
COPY --from=build /usr/local/bin/uvicorn /usr/local/bin/uvicorn

# copiere cod sursa
COPY . .

# .env NU este copiat in container
# variabilele de mediu sunt injectate la runtime prin docker-compose
RUN rm -f .env

EXPOSE 8085

# primul request OCR va dura 30-60 secunde — comportament asteptat
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8085", "--proxy-headers", "--forwarded-allow-ips", "*"]