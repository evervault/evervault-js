#!/usr/bin/env bash
# Tunnels the Apple Pay example over ngrok so Apple Pay's merchant-domain
# validation can be tested from Safari on a real device.
# See README.md for setup instructions.
#
# Usage:
#   ./run-tunnel.sh
#   NGROK_DOMAIN=my-domain.ngrok-free.dev ./run-tunnel.sh   # reserved domain
#   VERBOSE=1 ./run-tunnel.sh                               # stream dev server logs live

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"

APP_PORT=4000

# Pinned instead of ngrok's default 4040 so reading back our own tunnel URL
# can't pick up a stray agent's session, and an occupied 4040 doesn't break it.
NGROK_API=127.0.0.1:4041

# Vite's output is logged to a file and only shown if the server fails to come
# up, so the tunnel URL doesn't scroll away. VERBOSE=1 streams it live instead.
VERBOSE="${VERBOSE:-0}"

# --- Preflight checks ---
#
# Everything in this section is read-only, so a failure here exits without
# having touched a single process, port or file.

for cmd in ngrok lsof curl pnpm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $cmd is not installed." >&2
    exit 1
  fi
done

# `--config` replaces the default config rather than merging with it, so the file
# holding the authtoken must be passed alongside our generated one below — else
# ngrok starts unauthenticated (ERR_NGROK_4018) despite a configured token.
NGROK_DEFAULT_CONFIG=""
if ngrok config check >/dev/null 2>&1; then
  NGROK_DEFAULT_CONFIG=$(ngrok config check 2>&1 | sed -n 's/^Valid configuration file at //p')
elif [ -z "${NGROK_AUTHTOKEN:-}" ]; then
  echo "ERROR: ngrok is not authenticated." >&2
  echo "  ngrok config add-authtoken <token>   # from https://dashboard.ngrok.com/get-started/your-authtoken" >&2
  echo "  # or: export NGROK_AUTHTOKEN=..." >&2
  exit 1
fi

# vite's envDir points at the repo root, so the app loads this itself — the
# script only has to check it's there.
if [ ! -f "$ROOT_ENV" ]; then
  echo "ERROR: $ROOT_ENV is missing — copy .env.example to .env first." >&2
  exit 1
fi

echo "Preflight checks passed."

# --- Scratch space + teardown ---

WORK_DIR=$(mktemp -d)
NGROK_CONFIG="$WORK_DIR/ngrok.yml"
NGROK_LOG="$WORK_DIR/ngrok.log"
APP_LOG="$WORK_DIR/app.log"

PIDS=()

# Killing by port is what actually reaches the dev server: pnpm wraps vite
# through several layers (pnpm -> sh -c -> vite) that don't reliably forward
# signals down.
#
# -sTCP:LISTEN is required, not a refinement: `lsof -i tcp:PORT` matches a
# remote port too, so without it a browser tab open on localhost:$APP_PORT (and
# the ngrok agent, which dials it) count as holding the port and get killed.
free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "  port $port held by: $(ps -o command= -p $pids 2>/dev/null | cut -c1-60 | tr '\n' ';')"
    kill $pids 2>/dev/null || true
    sleep 1
    # vite runs with strictPort, so a process that ignored SIGTERM would make it
    # fail later with an unrelated-looking error. Escalate instead.
    pids=$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)
    if [ -n "$pids" ]; then
      kill -9 $pids 2>/dev/null || true
      sleep 1
    fi
  fi
  return 0
}

CLEANED_UP=0
cleanup() {
  if [ "$CLEANED_UP" = "1" ]; then
    return 0
  fi
  CLEANED_UP=1

  echo
  echo "Tearing down..."

  for pid in "${PIDS[@]:-}"; do
    if [ -n "${pid:-}" ]; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Backstop in case the PID above missed. Matched on our generated config path
  # rather than "ngrok start --all", which -f would also match in an unrelated
  # agent started by another project or terminal. WORK_DIR is unique per run, so
  # this can only ever match our own.
  pkill -f "$NGROK_CONFIG" 2>/dev/null || true
  free_port "$APP_PORT"

  rm -rf "$WORK_DIR"
  echo "Done. Nothing in the repo was modified, so there is nothing to restore."
}

# Trapping cleanup on INT/TERM directly would run it twice — once for the
# signal, then again for the EXIT that follows. Turning the signals into an exit
# keeps a single cleanup path. The trap is installed here, after preflight, so
# it can never fire before WORK_DIR exists.
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# --- Clear out the previous run ---
#
# Side effects start here. This is what makes back-to-back runs work.

if pgrep -f "ngrok start" >/dev/null 2>&1; then
  echo "Killing an existing ngrok agent (free plan allows one session at a time):"
  ps -o pid=,command= -p $(pgrep -f "ngrok start") 2>/dev/null | cut -c1-80 | sed 's/^/ /'
  pkill -x ngrok 2>/dev/null || true
  sleep 1
fi

echo "Freeing port $APP_PORT if a stale process is squatting on it..."
free_port "$APP_PORT"

# --- Start the tunnel ---
#
# Started before the dev server is up; ngrok just proxies once something starts
# listening on the port, so the order doesn't matter.

SQ="'" # a literal single quote isn't writable inline in the substitution below

{
  echo "version: 2"
  echo "web_addr: $NGROK_API"
  echo "tunnels:"
  echo "  app:"
  echo "    proto: http"
  echo "    addr: https://localhost:$APP_PORT"
  # The app serves https with a self-signed cert (@vitejs/plugin-basic-ssl), so
  # ngrok must not try to verify it.
  echo "    verify_upstream_tls: false"
  if [ -n "${NGROK_DOMAIN:-}" ]; then
    echo "    domain: $NGROK_DOMAIN"
  fi
  if [ -n "${NGROK_BASIC_AUTH:-}" ]; then
    # Emitted as a single-quoted YAML scalar, which treats " and \ literally, so
    # only ' needs escaping (by doubling it) for a password to survive intact.
    echo "    traffic_policy:"
    echo "      on_http_request:"
    echo "        - actions:"
    echo "            - type: basic-auth"
    echo "              config:"
    echo "                realm: apple-pay dev tunnel"
    echo "                credentials:"
    echo "                  - '${NGROK_BASIC_AUTH//$SQ/$SQ$SQ}'"
  fi
} > "$NGROK_CONFIG"

echo "Starting ngrok..."
NGROK_START_ARGS=(start --all)
if [ -n "$NGROK_DEFAULT_CONFIG" ]; then
  NGROK_START_ARGS+=(--config="$NGROK_DEFAULT_CONFIG")
fi
NGROK_START_ARGS+=(--config="$NGROK_CONFIG")
ngrok "${NGROK_START_ARGS[@]}" > "$NGROK_LOG" 2>&1 &
PIDS+=($!)

# `|| true` because finding nothing is the expected case on early iterations of
# the poll loop, not an error — without it `set -e` would kill the script the
# first time curl comes back empty-handed.
get_ngrok_url() {
  curl -s --max-time 2 "http://$NGROK_API/api/tunnels" 2>/dev/null \
    | grep -oE '"public_url":"[^"]+"' \
    | head -1 \
    | sed 's/.*:"//; s/"$//' \
    || true
}

echo "Waiting for the tunnel..."
APP_URL=""
for _ in $(seq 1 45); do
  APP_URL=$(get_ngrok_url)
  if [ -n "$APP_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$APP_URL" ]; then
  echo "ERROR: the ngrok tunnel did not come up within 45s. Log:" >&2
  sed 's/^/  /' "$NGROK_LOG" >&2 2>/dev/null || true
  exit 1
fi

echo "Tunnel ready: $APP_URL"

# --- Start the dev server ---
#
# No env overrides needed: nothing about the app changes when it's tunnelled.
# vite skips Host-header validation entirely when server.https is set (which
# plugin-basic-ssl does), and `host: true` isn't needed either — the ngrok agent
# runs on this machine and dials localhost.

echo "Starting the apple-pay example..."
if [ "$VERBOSE" = "1" ]; then
  ( cd "$ROOT_DIR" && pnpm --filter example-apple-pay dev ) &
else
  ( cd "$ROOT_DIR" && pnpm --filter example-apple-pay dev ) > "$APP_LOG" 2>&1 &
fi
PIDS+=($!)

for _ in $(seq 1 60); do
  if curl -sk "https://localhost:$APP_PORT" -o /dev/null; then
    break
  fi
  sleep 1
done
if ! curl -sk "https://localhost:$APP_PORT" -o /dev/null; then
  echo "Timed out waiting for the apple-pay example on https://localhost:$APP_PORT" >&2
  if [ "$VERBOSE" != "1" ]; then
    echo "---- dev server log ----" >&2
    cat "$APP_LOG" >&2 2>/dev/null || true
    echo "------------------------" >&2
  fi
  exit 1
fi

MERCHANT_HOST="${APP_URL#https://}"
MERCHANT_HOST="${MERCHANT_HOST%%/*}"

echo
echo "Ready. Open $APP_URL in Safari on a device with a Wallet card."
echo "(ngrok's free tier shows an 'You are about to visit...' warning page first —"
echo " click 'Visit Site'. Apple's domain validation fetch isn't affected by it.)"
echo
echo "Register this domain on the merchant's Apple Pay domains:"
echo "  $MERCHANT_HOST"
echo
echo "Ctrl+C to tear down."

# A bare `wait` would keep the script alive after the tunnel or dev server died,
# leaving a setup that looks healthy but isn't. macOS ships bash 3.2, which has
# no `wait -n`, so poll instead and tear down on the first death.
while :; do
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "The tunnel or dev server exited (PID $pid) — tearing down." >&2
      exit 1
    fi
  done
  sleep 5
done
