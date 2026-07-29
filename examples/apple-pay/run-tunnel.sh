#!/usr/bin/env bash
# Tunnels the Apple Pay example (+ its ui-components/browser dev servers)
# over ngrok, so Apple Pay's merchant-domain validation can be tested from
# iOS Safari / a real device.
# See README.md for full setup instructions.
#
# Usage:
#   ./run-tunnel.sh
#   NGROK_DOMAIN=my-domain.ngrok-free.dev ./run-tunnel.sh   # reserved domain

set -euo pipefail

APP_PORT=4000
UI_COMPONENTS_PORT=4001
BROWSER_BUNDLE_PORT=4002

# --- Preflight checks ---

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ERROR: ngrok is not installed."
  echo "  brew install --cask ngrok"
  exit 1
fi

if ! ngrok config check >/dev/null 2>&1 && [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "ERROR: ngrok is not authenticated."
  echo "  ngrok config add-authtoken <token>   # from https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  # or: export NGROK_AUTHTOKEN=..."
  exit 1
fi

if pgrep -f "ngrok start" >/dev/null 2>&1; then
  echo "Killing existing ngrok session (free plan allows only one at a time)..."
  pkill -x ngrok 2>/dev/null || true
  sleep 1
fi

echo "Preflight checks passed."

# --- Free ports ---

free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti "tcp:$port" 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "Port $port already in use by PID(s) $pids — killing stale process(es)."
    kill $pids 2>/dev/null || true
    sleep 1
  fi
}

echo "Freeing ports if stale processes are squatting on them..."
free_port "$APP_PORT"
free_port "$UI_COMPONENTS_PORT"
free_port "$BROWSER_BUNDLE_PORT"

