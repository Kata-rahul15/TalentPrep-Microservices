# ---------- Build Stage ----------
FROM maven:3.9.11-eclipse-temurin-17 AS builder

WORKDIR /app

COPY . .

RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY --from=builder /app/target/Auth-service.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]