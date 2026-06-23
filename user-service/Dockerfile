# ===== BUILD STAGE =====
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /app

# Copiere pom.xml si download dependencies (cache layer)
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -B

# Copiere cod sursa si build
COPY src ./src
RUN ./mvnw clean package -DskipTests


# ===== RUNTIME STAGE =====
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiere JAR din build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8082

ENTRYPOINT ["java", "-jar", "app.jar"]