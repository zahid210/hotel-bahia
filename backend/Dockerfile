# ════════════════════════════════════════════════════════════════
# Hotel Bahía — Imagen única backend: compila el frontend con Node y
# lo sirve Spring Boot desde src/main/resources/static.
# Resultado: una sola imagen sirve la web + la API en :8080 (sin nginx).
# ════════════════════════════════════════════════════════════════

# ── Etapa 1: Build frontend (React) ────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend ./
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Etapa 2: Build backend (Spring Boot) ───────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

COPY backend/.mvn/ .mvn/
COPY backend/mvnw backend/pom.xml ./
RUN ./mvnw dependency:go-offline -q

COPY backend/src ./src
COPY --from=frontend-build /frontend/dist ./src/main/resources/static
RUN ./mvnw package -DskipTests -q

# ── Etapa 3: Runtime ───────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S hotel && adduser -S hotel -G hotel
USER hotel

COPY --chown=hotel:hotel --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Duser.timezone=America/Lima", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]