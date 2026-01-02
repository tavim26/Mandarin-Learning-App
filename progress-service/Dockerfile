FROM amazoncorretto:21-alpine AS build

WORKDIR /app

# Copiere pom.xml si download dependencies
COPY pom.xml .
COPY mvnw .
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -B

# Copiere cod sursa si build
COPY src ./src
RUN ./mvnw clean package -DskipTests

# Runtime stage
FROM amazoncorretto:21-alpine

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]