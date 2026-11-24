
# Build stage
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Copy Maven wrapper and dependency configuration first
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

RUN chmod +x mvnw

# Cache dependencies
RUN ./mvnw -B -DskipTests dependency:go-offline

# Copy application source
COPY src/ src/

# Build without compiling or executing tests
RUN ./mvnw -B -Dmaven.test.skip=true package

# Copy executable JAR
RUN set -eux; \
    JAR="$(find target -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | head -n 1)"; \
    test -n "$JAR"; \
    cp "$JAR" /app/app.jar

# Runtime stage
FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /app/app.jar ./app.jar

EXPOSE 8083

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar --server.port=${PORT:-8083}"]
