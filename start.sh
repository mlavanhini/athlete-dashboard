#!/bin/bash
# Soccer Finance & Strategy Dashboard — start all services
# Usage: ./start.sh
# Prerequisite: Transfermarkt wrapper must already be running on :8000
#   (see README for setup: git clone felipeall/transfermarkt-api)

set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting backend (FastAPI :8001)…"
cd "$ROOT/backend"
uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

echo "Starting frontend (Vite :5173)…"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Dashboard:  http://localhost:5173"
echo "API docs:   http://localhost:8001/docs"
echo "TM wrapper: http://localhost:8000/docs  (must be running separately)"
echo ""
echo "Press Ctrl+C to stop both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
