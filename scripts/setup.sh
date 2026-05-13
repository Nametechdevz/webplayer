#!/usr/bin/env bash
# =============================================================================
# scripts/setup.sh — First-run setup for the IPTV Streaming Platform
#
# What it does:
#   1. Copies .env.example → .env (if .env does not yet exist)
#   2. Starts postgres + redis and waits until both report healthy
#   3. Runs Prisma migrations (prisma migrate deploy)
#   4. Seeds the database (admin user, default profiles, example provider)
#   5. Starts the full stack (frontend + backend + nginx)
#   6. Prints a success summary with service URLs
#
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[setup]${RESET} $*"; }
success() { echo -e "${GREEN}[setup]${RESET} $*"; }
warn()    { echo -e "${YELLOW}[setup]${RESET} $*"; }
error()   { echo -e "${RED}[setup] ERROR:${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}$*${RESET}\n"; }

# ── Resolve project root (one level above this script) ────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"
info "Working directory: ${PROJECT_ROOT}"

# ── 1. Environment file ───────────────────────────────────────────────────────
header "Step 1/5 — Environment configuration"

if [[ -f ".env" ]]; then
  info ".env already exists — skipping copy."
else
  if [[ ! -f ".env.example" ]]; then
    error ".env.example not found. Cannot continue."
    exit 1
  fi
  cp .env.example .env
  success ".env created from .env.example"
  warn "Review .env and set production secrets before deploying to the internet."
fi

# Source it so we can read ADMIN_* values for the summary
# shellcheck source=/dev/null
set -a; source .env; set +a

# ── Check docker / docker compose ────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  error "docker is not installed or not in PATH."
  exit 1
fi

# Support both "docker compose" (v2) and "docker-compose" (v1)
if docker compose version &>/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose &>/dev/null; then
  DC="docker-compose"
else
  error "Neither 'docker compose' nor 'docker-compose' found."
  exit 1
fi

info "Using compose command: ${DC}"

# ── 2. Start postgres + redis and wait for healthy ────────────────────────────
header "Step 2/5 — Starting database & cache services"

info "Pulling images (this may take a moment on first run)..."
${DC} pull postgres redis --quiet 2>&1 | grep -v "^$" || true

info "Starting postgres and redis..."
${DC} up -d postgres redis

info "Waiting for postgres to become healthy..."
TIMEOUT=120
ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' iptv_postgres 2>/dev/null | grep -q "healthy"; do
  if (( ELAPSED >= TIMEOUT )); then
    error "Timed out waiting for postgres (${TIMEOUT}s). Check logs: ${DC} logs postgres"
    exit 1
  fi
  printf "."
  sleep 3
  ELAPSED=$(( ELAPSED + 3 ))
done
echo ""
success "postgres is healthy."

info "Waiting for redis to become healthy..."
ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' iptv_redis 2>/dev/null | grep -q "healthy"; do
  if (( ELAPSED >= TIMEOUT )); then
    error "Timed out waiting for redis (${TIMEOUT}s). Check logs: ${DC} logs redis"
    exit 1
  fi
  printf "."
  sleep 2
  ELAPSED=$(( ELAPSED + 2 ))
done
echo ""
success "redis is healthy."

# ── 3. Run database migrations ────────────────────────────────────────────────
header "Step 3/5 — Running database migrations"

info "Running: prisma migrate deploy"
${DC} run --rm \
  -e DATABASE_URL="${DATABASE_URL}" \
  backend \
  npx prisma migrate deploy

success "Migrations applied."

# ── 4. Seed the database ──────────────────────────────────────────────────────
header "Step 4/5 — Seeding database"

info "Creating admin user, default profiles, and example provider..."
${DC} run --rm \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e ADMIN_EMAIL="${ADMIN_EMAIL:-admin@iptv.local}" \
  -e ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123!}" \
  backend \
  node prisma/seed.js

success "Database seeded."

# ── 5. Start all services ─────────────────────────────────────────────────────
header "Step 5/5 — Starting all services"

info "Building and starting the full stack..."
${DC} up -d --build

info "Waiting for services to stabilise..."
sleep 5

# ── Print status ──────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║     IPTV Platform is up and running!                 ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${BOLD}  Service URLs${RESET}"
echo -e "  ${CYAN}Web Player   ${RESET}→  http://${NGINX_HOST:-localhost}:${NGINX_PORT:-80}"
echo -e "  ${CYAN}API          ${RESET}→  http://${NGINX_HOST:-localhost}:${NGINX_PORT:-80}/api"
echo -e "  ${CYAN}Frontend Dev ${RESET}→  http://localhost:3000"
echo -e "  ${CYAN}Backend Dev  ${RESET}→  http://localhost:3001"
echo ""
echo -e "${BOLD}  Admin credentials${RESET}"
echo -e "  ${CYAN}Email    ${RESET}: ${ADMIN_EMAIL:-admin@iptv.local}"
echo -e "  ${CYAN}Password ${RESET}: ${ADMIN_PASSWORD:-Admin@123!}"
echo ""
echo -e "${YELLOW}  Change the admin password after your first login.${RESET}"
echo ""
echo -e "${BOLD}  Useful commands${RESET}"
echo -e "  ${CYAN}View logs     ${RESET}: ${DC} logs -f"
echo -e "  ${CYAN}Stop stack    ${RESET}: ${DC} down"
echo -e "  ${CYAN}DB studio     ${RESET}: cd backend && npm run db:studio"
echo ""
