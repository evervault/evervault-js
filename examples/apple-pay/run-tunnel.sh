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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
BROWSER_DIR="$ROOT_DIR/packages/browser"
UI_COMPONENTS_DIR="$ROOT_DIR/packages/ui-components"
ROOT_ENV="$ROOT_DIR/.env"

APP_PORT=4000
UI_COMPONENTS_PORT=4001
BROWSER_BUNDLE_PORT=4002

# Guards cleanup() below — stays 0 until preflight checks pass,
# so a preflight failure just exits without touching anything.
PAST_PREFLIGHT=0

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

check_vite_config_clean() {
  local file="$1"
  if grep -qE "host: true|allowedHosts" "$file"; then
    echo "ERROR: $file already has 'host: true' or 'allowedHosts'."
    echo "  This script patches those and expects them absent."
    echo "  Remove them (or restore the file from git) and retry."
    exit 1
  fi
}

check_vite_config_clean "$APP_DIR/vite.config.ts"
check_vite_config_clean "$BROWSER_DIR/vite.config.mts"
check_vite_config_clean "$UI_COMPONENTS_DIR/vite.config.ts"

PAST_PREFLIGHT=1
echo "Preflight checks passed."

# --- Backup + cleanup trap ---
#
# .env and the 3 vite configs get patched below; none of that is meant to
# stick around, so back everything up now and restore it whenever this
# script exits (normally, Ctrl+C, or killed).

if [[ ! -f "$ROOT_ENV" ]]; then
  echo "ERROR: $ROOT_ENV is missing — copy .env.example to .env first."
  exit 1
fi

ENV_BACKUP=$(mktemp)
APP_VITE_BACKUP=$(mktemp)
BROWSER_VITE_BACKUP=$(mktemp)
UI_COMPONENTS_VITE_BACKUP=$(mktemp)

cp "$ROOT_ENV" "$ENV_BACKUP"
cp "$APP_DIR/vite.config.ts" "$APP_VITE_BACKUP"
cp "$BROWSER_DIR/vite.config.mts" "$BROWSER_VITE_BACKUP"
cp "$UI_COMPONENTS_DIR/vite.config.ts" "$UI_COMPONENTS_VITE_BACKUP"

PIDS=()

cleanup() {
  [[ "$PAST_PREFLIGHT" == "1" ]] || return

  echo
  echo "Tearing down..."

  for pid in "${PIDS[@]:-}"; do
    [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
  done
  pkill -f "vite --port $APP_PORT" 2>/dev/null || true
  pkill -f "vite build --watch" 2>/dev/null || true
  pkill -f "vite preview" 2>/dev/null || true
  pkill -f "ngrok start --all" 2>/dev/null || true

  cp "$ENV_BACKUP" "$ROOT_ENV"
  cp "$APP_VITE_BACKUP" "$APP_DIR/vite.config.ts"
  cp "$BROWSER_VITE_BACKUP" "$BROWSER_DIR/vite.config.mts"
  cp "$UI_COMPONENTS_VITE_BACKUP" "$UI_COMPONENTS_DIR/vite.config.ts"
  echo "Restored .env and vite configs."

  rm -f "$ENV_BACKUP" "$APP_VITE_BACKUP" "$BROWSER_VITE_BACKUP" "$UI_COMPONENTS_VITE_BACKUP"
}
trap cleanup EXIT INT TERM

# --- Patch vite configs for ngrok ---
#
# host:true and allowedHosts only needed while a tunnel is active. 
# This patches them in after each file's `port: <N>,` line.

patch_vite_config() {
  local file="$1"
  local port="$2"
  python3 - "$file" "$port" <<'PYEOF'
import sys

path, port = sys.argv[1], sys.argv[2]
marker = f"port: {port},"
allowed_hosts = '[".vercel.app", ".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"]'

with open(path) as f:
    lines = f.readlines()

out = []
for line in lines:
    out.append(line)
    if marker in line:
        indent = line[: len(line) - len(line.lstrip())]
        out.append(f"{indent}host: true,\n")
        out.append(f"{indent}allowedHosts: {allowed_hosts},\n")

with open(path, "w") as f:
    f.writelines(out)
PYEOF
}

echo "Patching vite configs for ngrok tunneling..."
patch_vite_config "$APP_DIR/vite.config.ts" "$APP_PORT"
patch_vite_config "$BROWSER_DIR/vite.config.mts" "$BROWSER_BUNDLE_PORT"
patch_vite_config "$UI_COMPONENTS_DIR/vite.config.ts" "$UI_COMPONENTS_PORT"

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
