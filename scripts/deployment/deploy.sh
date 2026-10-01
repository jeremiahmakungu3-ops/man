#!/usr/bin/env bash
# ==============================================================================
# XCLOUD Production Deployment Script
# Provisions Docker containers, builds frontend, runs migrations & initializes DB
# ==============================================================================

set -euo pipefail

echo "=================================================="
echo "    XCLOUD ISP & Hotspot Automation Platform     "
echo "=================================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

# Load Environment
if [ ! -f .env ]; then
    echo "[*] .env file not found, creating from .env.example..."
    cp .env.example .env
    echo "[!] Please review and edit secrets in .env before continuing."
fi

echo "[*] Pulling and building Docker images..."
docker compose build

echo "[*] Launching database and messaging cluster..."
docker compose up -d postgres redis freeradius
sleep 4

echo "[*] Executing database migrations..."
docker compose run --rm backend python manage.py migrate

echo "[*] Seeding production schemas..."
docker compose run --rm backend python manage.py loaddata initial_seed.json || true

echo "[*] Starting all application services..."
docker compose up -d

echo "[✔] XCLOUD is now live and running:"
echo "    - Dashboard & Portal: http://localhost:3000"
echo "    - Backend REST API:   http://localhost:8000/api/"
echo "    - FreeRADIUS Auth:    udp://localhost:1812"
echo "    - FreeRADIUS Acct:    udp://localhost:1813"
echo "=================================================="
