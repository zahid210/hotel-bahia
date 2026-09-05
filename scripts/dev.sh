#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Hotel Bahía — Arranque 100% local (MySQL/MariaDB + Backend + Frontend)
# Uso:
#   ./scripts/dev.sh            # levanta backend + frontend
#   ./scripts/dev.sh --backend
#   ./scripts/dev.sh --frontend
#   ./scripts/dev.sh --setup-db # solo crea usuario/BD si faltan
#   ./scripts/dev.sh --stop     # detiene backend y frontend
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
DB_NAME="hotel_bahia"
DB_USER="hotel"
DB_PASS="hotel_bahia"

stop_all() {
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "$FRONTEND/node_modules/.bin/vite" 2>/dev/null || true
    sleep 1
}

do_setup_db() {
    mysqladmin ping --silent 2>/dev/null || {
        echo "MySQL/MariaDB no está corriendo. Ejecuta: sudo systemctl start mariadb"
        exit 1
    }

    sudo mariadb -e "
        CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
        GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
        FLUSH PRIVILEGES;
    "

    echo "✔ Base de datos '$DB_NAME' lista en localhost:3306"
}

run_backend() {
    if [ ! -f /usr/lib/jvm/java-21-openjdk-amd64/bin/java ]; then
        echo "⚠ No se encontró Java 21 en /usr/lib/jvm/java-21-openjdk-amd64."
    fi
    export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk-amd64}"
    echo "▶ Backend en http://localhost:8080  (perfil local)"
    cd "$BACKEND" && ./mvnw -q spring-boot:run -Dspring-boot.run.profiles=local
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
    --stop)     stop_all; echo "✔ Backend y frontend detenidos" ;;
    --backend)  do_setup_db; stop_all; run_backend ;;
    --frontend) stop_all; run_frontend ;;
    all)        do_setup_db; stop_all; run_backend & run_frontend ; wait ;;
    *) echo "Uso: $0 [all|--backend|--frontend|--setup-db|--stop]"; exit 1 ;;
esac