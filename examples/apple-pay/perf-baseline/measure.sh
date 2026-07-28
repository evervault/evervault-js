#!/usr/bin/env bash
# CARD-993 baseline-capture helper for Apple Pay render latency.
# Not part of the shipped SDK — local dev tooling only, safe to delete anytime.
#
# One-time setup (do these yourself, not scripted — they touch your own
# accounts/credentials):
#   1. `ngrok config add-authtoken <your-token>` (from your ngrok dashboard).
#   2. Claim your free permanent dev domain in the ngrok dashboard
#      (Universal Gateway -> Domains) — looks like abc123xyz.ngrok-free.dev.
#   3. Verify that domain with Apple for this merchant ID (one-time; the
#      example app already serves the domain-association file from
#      examples/apple-pay/public/.well-known/).
#   4. Confirm the repo-root .env points at *sandbox/test* Apple Pay
#      credentials — this tunnel will be briefly internet-reachable.
#
# What this spins up (one ngrok agent session, 3 simultaneous endpoints —
# the max the free plan allows):
#   :4000  the example app itself       -> pinned to your verified domain
#   :4001  packages/ui-components dev  -> ephemeral URL, re-detected each run
#   :4002  packages/browser bundle     -> ephemeral URL, re-detected each run
# Only :4000 is ever checked by Apple, so only it needs to stay fixed; the
# other two can (and will) get a fresh ngrok-assigned URL every time this
# script runs — it rewrites them into the repo-root .env automatically
# before starting the app, and restores your original .env on exit.
#
# Usage:
#   NGROK_DOMAIN=abc123xyz.ngrok-free.dev \
#   NGROK_BASIC_AUTH=someuser:somepass \
#   ./measure.sh

set -euo pipefail

: "${NGROK_DOMAIN:?Set NGROK_DOMAIN to your claimed ngrok dev domain}"
: "${NGROK_BASIC_AUTH:?Set NGROK_BASIC_AUTH to user:pass to protect the main app tunnel}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/.."
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BROWSER_DIR="$ROOT_DIR/packages/browser"
UI_COMPONENTS_DIR="$ROOT_DIR/packages/ui-components"
ROOT_ENV="$ROOT_DIR/.env"

APP_PORT=4000
UI_COMPONENTS_PORT=4001
BROWSER_BUNDLE_PORT=4002

LOG_FILE="$SCRIPT_DIR/results.csv"
NGROK_CONFIG="$(mktemp)"
NGROK_LOG="$(mktemp)"
TUNNELS_JSON="$(mktemp)"
ENV_BACKUP="$(mktemp)"

PIDS=()

cleanup() {
  echo
  echo "Tearing down..."
  for pid in "${PIDS[@]:-}"; do
    [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
  done
  # Belt-and-braces in case any of the above spawned detached children.
  pkill -f "vite --port $APP_PORT" 2>/dev/null || true
  pkill -f "vite build --watch" 2>/dev/null || true
  pkill -f "vite preview" 2>/dev/null || true
  pkill -f "ngrok start --all --config=$NGROK_CONFIG" 2>/dev/null || true

  if [[ -f "$ENV_BACKUP" ]]; then
    cp "$ENV_BACKUP" "$ROOT_ENV"
    echo "Restored original $ROOT_ENV"
  fi
  rm -f "$NGROK_CONFIG" "$NGROK_LOG" "$TUNNELS_JSON" "$ENV_BACKUP"
}
trap cleanup EXIT INT TERM

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

wait_for_http() {
  local url="$1"
  local label="$2"
  for _ in $(seq 1 60); do
    curl -sk "$url" -o /dev/null && return 0
    sleep 1
  done
  echo "Timed out waiting for $label ($url)" >&2
  return 1
}

get_tunnel_url() {
  local name="$1"
  curl -s http://127.0.0.1:4040/api/tunnels > "$TUNNELS_JSON"
  python3 - "$name" "$TUNNELS_JSON" <<'PYEOF'
import json, sys
name, path = sys.argv[1], sys.argv[2]
try:
    with open(path) as f:
        data = json.load(f)
    for t in data.get("tunnels", []):
        if t.get("name") == name:
            print(t.get("public_url", ""))
            break
except Exception:
    pass
PYEOF
}

cp "$ROOT_ENV" "$ENV_BACKUP"

echo "Freeing ports if stale processes are squatting on them..."
free_port "$APP_PORT"
free_port "$UI_COMPONENTS_PORT"
free_port "$BROWSER_BUNDLE_PORT"

echo "Starting packages/browser dev (build --watch + preview :$BROWSER_BUNDLE_PORT)..."
( cd "$BROWSER_DIR" && pnpm dev ) &
PIDS+=($!)
wait_for_http "http://localhost:$BROWSER_BUNDLE_PORT" "evervault-browser bundle server"

echo "Starting packages/ui-components dev (:$UI_COMPONENTS_PORT)..."
( cd "$UI_COMPONENTS_DIR" && pnpm dev ) &
PIDS+=($!)
wait_for_http "http://localhost:$UI_COMPONENTS_PORT" "ui-components dev server"

cat > "$NGROK_CONFIG" <<EOF
version: 2
tunnels:
  app:
    proto: http
    addr: https://localhost:$APP_PORT
    domain: $NGROK_DOMAIN
    traffic_policy:
      on_http_request:
        - actions:
            - type: basic-auth
              config:
                realm: CARD-993 baseline
                credentials:
                  - "$NGROK_BASIC_AUTH"
  ui-components:
    proto: http
    addr: http://localhost:$UI_COMPONENTS_PORT
  browser-bundle:
    proto: http
    addr: http://localhost:$BROWSER_BUNDLE_PORT
EOF

echo "Starting ngrok (3 tunnels, one agent session)..."
ngrok start --all --config="$NGROK_CONFIG" > "$NGROK_LOG" 2>&1 &
PIDS+=($!)

echo "Waiting for ngrok tunnels..."
APP_URL="" ; UI_COMPONENTS_URL="" ; BROWSER_BUNDLE_URL=""
for _ in $(seq 1 30); do
  APP_URL=$(get_tunnel_url app)
  UI_COMPONENTS_URL=$(get_tunnel_url ui-components)
  BROWSER_BUNDLE_URL=$(get_tunnel_url browser-bundle)
  [[ -n "$APP_URL" && -n "$UI_COMPONENTS_URL" && -n "$BROWSER_BUNDLE_URL" ]] && break
  sleep 1
done

if [[ -z "$APP_URL" || -z "$UI_COMPONENTS_URL" || -z "$BROWSER_BUNDLE_URL" ]]; then
  echo "ngrok tunnels did not fully come up — check $NGROK_LOG" >&2
  exit 1
fi

echo "Rewriting $ROOT_ENV with fresh tunnel URLs (:4001, :4002)..."
python3 - "$ROOT_ENV" "$UI_COMPONENTS_URL" "$BROWSER_BUNDLE_URL" <<'PYEOF'
import sys
env_path, ui_url, bundle_url = sys.argv[1], sys.argv[2], sys.argv[3]
ui_line = f"VITE_UI_COMPONENTS_URL={ui_url}"
bundle_line = f"VITE_EVERVAULT_JS_URL={bundle_url}/evervault-browser.main.umd.cjs"

with open(env_path) as f:
    lines = f.readlines()

seen_ui = seen_bundle = False
out = []
for line in lines:
    stripped = line.strip()
    if stripped.startswith("VITE_UI_COMPONENTS_URL="):
        out.append(ui_line + "\n")
        seen_ui = True
    elif stripped.startswith("VITE_EVERVAULT_JS_URL="):
        out.append(bundle_line + "\n")
        seen_bundle = True
    else:
        out.append(line)

if not seen_ui:
    out.append(ui_line + "\n")
if not seen_bundle:
    out.append(bundle_line + "\n")

with open(env_path, "w") as f:
    f.writelines(out)
PYEOF

echo "Starting Apple Pay example app on port $APP_PORT..."
( cd "$APP_DIR" && pnpm exec vite --port "$APP_PORT" ) &
PIDS+=($!)
wait_for_http "https://localhost:$APP_PORT" "Apple Pay example app"

if [[ ! -f "$LOG_FILE" ]]; then
  echo "timestamp,browser,round,measure,duration_ms" > "$LOG_FILE"
fi

echo
echo "=========================================================="
echo " App (Apple-verified, fixed):  $APP_URL"
echo "   basic-auth: $NGROK_BASIC_AUTH"
echo " ui-components (ephemeral):    $UI_COMPONENTS_URL"
echo " browser bundle (ephemeral):   $BROWSER_BUNDLE_URL"
echo "=========================================================="
echo
echo "For each measurement round:"
echo "  1. Open $APP_URL in Safari or Chrome (enter the basic-auth"
echo "     credentials when prompted)."
echo "  2. Do the flow you want to measure (page load mounts the button;"
echo "     tap through the sheet with a Wallet card for the other spans)."
echo "  3. In devtools console, run:"
echo
cat <<'JS'
     copy(performance.getEntriesByType("measure")
       .filter(m => m.name.startsWith("ev:apple-pay:"))
       .map(m => `${m.name},${m.duration.toFixed(1)}`)
       .join("\n"))
JS
echo
echo "     This copies CSV rows straight to your clipboard."
echo
echo "Paste the copied rows below (one per line), then an empty line to save"
echo "that round. Type 'q' at the browser prompt to quit and tear down."
echo

round=1
while true; do
  read -rp "[round $round] browser (safari/chrome, or q to quit): " browser
  [[ "$browser" == "q" ]] && break

  echo "Paste rows (measure,duration_ms), empty line to finish:"
  while IFS= read -r line; do
    [[ -z "$line" ]] && break
    ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "$ts,$browser,$round,$line" >> "$LOG_FILE"
  done

  round=$((round + 1))
done

echo
echo "Saved results to $LOG_FILE"
