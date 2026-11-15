# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn ./.mvn
RUN ./mvnw -q -B dependency:go-offline || true
COPY src ./src
RUN ./mvnw -q -B clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN useradd --system --uid 1001 --no-create-home appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app
COPY --from=build --chown=appuser:appuser /app/target/agtech-backend-0.0.1-SNAPSHOT.jar app.jar
USER appuser
ENTRYPOINT ["sh", "-c", "java -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar --server.port=${PORT:-8081}"]
