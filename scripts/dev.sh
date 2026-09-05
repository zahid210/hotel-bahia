#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Hotel Bahía — Arranque 100% local (PostgreSQL + Backend + Frontend)
# Uso:
#   ./scripts/dev.sh            # levanta backend + frontend
#   ./scripts/dev.sh --backend
#   ./scripts/dev.sh --frontend
#   ./scripts/dev.sh --setup-db # solo crea usuario/BD si faltan
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DB_NAME="hotel_bahia"
DB_USER="hotel"
DB_PASS="hotel_bahia"
JAVA_VERSION="21"

do_setup_db() {
    pg_isready -q || { echo "PostgreSQL no está corriendo. Ejecuta: sudo systemctl start postgresql"; exit 1; }

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

    sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

    echo "✔ Base de datos '$DB_NAME' lista en localhost:5432"
}

run_backend() {
    if [ ! -f /usr/lib/jvm/java-${JAVA_VERSION}-openjdk-amd64/bin/java ]; then
        echo "⚠ No se encontró Java 21 en /usr/lib/jvm/java-21-openjdk-amd64."
    fi
    export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
    echo "▶ Backend en http://localhost:8080  (perfil local)"
    cd "$BACKEND" && ./mvnw -q spring-boot:run
}

run_frontend() {
    if [ ! -d "$FRONTEND/node_modules" ]; then
        echo "• Instalando dependencias del frontend…"
        (cd "$FRONTEND" && npm install)
    fi
    echo "▶ Frontend en http://localhost:5173"
    cd "$FRONTEND" && npm run dev
}

MODE="${1:-all}"
case "$MODE" in
    --setup-db) do_setup_db ;;
    --backend)  do_setup_db; run_backend ;;
    --frontend) run_frontend ;;
    all)        do_setup_db; run_backend & run_frontend ; wait ;;
    *) echo "Uso: $0 [all|--backend|--frontend|--setup-db]"; exit 1 ;;
esac