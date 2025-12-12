# --------- ETAPA 1: BUILD (Compilarea) ---------
# Folosim o imagine oficiala Maven care are deja Java 21 (Amazon Corretto)
FROM maven:3.9.6-amazoncorretto-21 AS build

# Setam directorul de lucru
WORKDIR /app

# Copiem doar fisierul pom.xml mai intai
# Asta ajuta Docker sa faca cache la dependente. Daca nu modifici pom.xml,
# Docker nu va mai descarca iarasi jumatate de internet la urmatorul build.
COPY pom.xml .

# Descarcam dependentele (fara sa copiem inca codul sursa)
RUN mvn dependency:go-offline

# Copiem restul codului sursa
COPY src ./src

# Compilam aplicatia si sarim peste teste pentru viteza
RUN mvn clean package -DskipTests

# --------- ETAPA 2: RUNTIME (Rularea) ---------
# Folosim imaginea usoara de Amazon Corretto 21 pentru rulare
FROM amazoncorretto:21

# Setam directorul de lucru
WORKDIR /app

# Copiem fisierul .jar generat in etapa anterioara (din alias-ul "build")
# Atentie: wildcard-ul *.jar va lua orice jar generat, asigurand flexibilitate la nume
COPY --from=build /app/target/*.jar app.jar

# Expunem portul
EXPOSE 8081

# Comanda de start
ENTRYPOINT ["java", "-jar", "app.jar"]