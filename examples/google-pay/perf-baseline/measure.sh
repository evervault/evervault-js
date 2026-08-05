#!/usr/bin/env bash
# CARD-993/995 baseline-capture helper for Google Pay render latency.
# Not part of the shipped SDK — local dev tooling only, safe to delete anytime.
#
# Unlike Apple Pay's perf-baseline/measure.sh, there's no tunnel here: Google
# Pay's merchant validation works over plain localhost (see
# examples/apple-pay/README.md's "why only the app is tunnelled" for why
# Apple Pay is the odd one out). What Google Pay does need instead is all
# three dev servers examples/index.js normally starts for this example — the
# Google Pay button is an iframe-mounted ui-components component (unlike
# Apple Pay's native <apple-pay-button>), so ui-components' own dev server
# and the browser bundle's both have to be up alongside the example itself.
#
# The ev:google-pay:* marks fire inside that iframe, so the RUM hook and the
# results.csv-appending endpoint live in packages/ui-components (see its
# src/perf-rum.ts and vite.config.ts) rather than here — this script just
# points PERF_BASELINE_RESULTS_CSV at this directory's results.csv, starts
# the three servers, and tails it. Just open the app and do as many Google
# Pay attempts as you want (each page load/reload is a new session), then
# Ctrl+C here when done.
#
# Usage:
#   ./measure.sh
#   VERBOSE=1 ./measure.sh   # stream the dev servers' log live

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ROOT_ENV="$ROOT_DIR/.env"
RESULTS_CSV="$SCRIPT_DIR/results.csv"

APP_PORT=4000
UI_COMPONENTS_PORT=4001
BROWSER_PORT=4002

# Vite's output is logged to a file and only shown if the servers fail to
# come up, so it doesn't scroll away the app URL. VERBOSE=1 streams it live.
VERBOSE="${VERBOSE:-0}"

# --- Preflight checks ---
#
# Everything in this section is read-only, so a failure here exits without
# having touched a single process, port or file.

for cmd in lsof curl pnpm dotenv; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: $cmd is not installed or not on PATH." >&2
    if [ "$cmd" = "dotenv" ]; then
      echo "  (dotenv lives in node_modules/.bin — run this via 'pnpm perf:baseline', not 'bash measure.sh' directly.)" >&2
    fi
    exit 1
  fi
done

# google-pay has no vite.config.ts of its own (unlike apple-pay's, which sets
# envDir to the repo root), so it only sees root .env values that are already
# in the environment when Vite starts — dotenv below is what puts them there,
# same as examples/index.js does for every example.
if [ ! -f "$ROOT_ENV" ]; then
  echo "ERROR: $ROOT_ENV is missing — copy .env.example to .env first." >&2
  exit 1
fi

echo "Preflight checks passed."

# --- Scratch space + teardown ---

WORK_DIR=$(mktemp -d)
DEV_LOG="$WORK_DIR/dev.log"

DEV_PID=""
TAIL_PID=""

# Killing by port is what actually reaches the dev servers: pnpm wraps vite
# through several layers (pnpm -> sh -c -> vite) that don't reliably forward
# signals down — same reasoning as apple-pay's run-tunnel.sh.
#
# -sTCP:LISTEN is required, not a refinement: `lsof -i tcp:PORT` matches a
# remote port too, so without it a browser tab open on localhost:$PORT counts
# as holding the port and gets killed.
free_port() {
  local port="$1"
  local pids
  pids=$(lsof -ti "tcp:$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    sleep 1
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

  [ -n "$TAIL_PID" ] && kill "$TAIL_PID" 2>/dev/null || true
  [ -n "$DEV_PID" ] && kill "$DEV_PID" 2>/dev/null || true

  free_port "$APP_PORT"
  free_port "$UI_COMPONENTS_PORT"
  free_port "$BROWSER_PORT"

  rm -rf "$WORK_DIR"
  echo "Done. Nothing in the repo was touched except results.csv, so there is nothing else to restore."
}
# Trapping cleanup on INT/TERM directly would run it twice — once for the
# signal, then again for the EXIT that follows. Turning the signals into an
# exit keeps a single cleanup path.
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Freeing ports $APP_PORT/$UI_COMPONENTS_PORT/$BROWSER_PORT if stale processes are squatting on them..."
free_port "$APP_PORT"
free_port "$UI_COMPONENTS_PORT"
free_port "$BROWSER_PORT"

# --- Start the dev servers ---
#
# Same three-package fan-out examples/index.js uses to run this example
# normally. The only addition is PERF_BASELINE_RESULTS_CSV, which tells
# ui-components' vite dev server where to append ev:google-pay:*
# measurements (packages/ui-components/vite.config.ts is a no-op without it,
# so this has no effect on any other dev flow that loads that package).

echo "Starting dev servers (ui-components, browser, google-pay)..."
if [ "$VERBOSE" = "1" ]; then
  ( cd "$ROOT_DIR" && PERF_BASELINE_RESULTS_CSV="$RESULTS_CSV" dotenv -- \
      pnpm --parallel --filter @evervault/ui-components --filter @evervault/browser --filter google-pay dev ) &
else
  ( cd "$ROOT_DIR" && PERF_BASELINE_RESULTS_CSV="$RESULTS_CSV" dotenv -- \
      pnpm --parallel --filter @evervault/ui-components --filter @evervault/browser --filter google-pay dev ) > "$DEV_LOG" 2>&1 &
fi
DEV_PID=$!

echo "Waiting for the dev servers..."
all_up() {
  curl -s "http://localhost:$APP_PORT" -o /dev/null \
    && curl -s "http://localhost:$UI_COMPONENTS_PORT" -o /dev/null \
    && curl -s "http://localhost:$BROWSER_PORT" -o /dev/null
}
READY=0
for _ in $(seq 1 90); do
  if all_up; then
    READY=1
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "Dev servers exited before becoming ready:" >&2
    [ "$VERBOSE" != "1" ] && cat "$DEV_LOG" >&2 2>/dev/null
    exit 1
  fi
  sleep 1
done

if [ "$READY" != "1" ]; then
  echo "Timed out waiting for the dev servers to come up on ports $APP_PORT/$UI_COMPONENTS_PORT/$BROWSER_PORT." >&2
  if [ "$VERBOSE" != "1" ]; then
    echo "---- dev server log ----" >&2
    cat "$DEV_LOG" >&2 2>/dev/null
    echo "------------------------" >&2
  fi
  exit 1
fi

if [ ! -f "$RESULTS_CSV" ]; then
  echo "timestamp,browser,session,measure,duration_ms" > "$RESULTS_CSV"
fi

echo
echo "=========================================================="
echo " App: http://localhost:$APP_PORT"
echo "=========================================================="
echo
echo "Open http://localhost:$APP_PORT — no tunnel and no domain-registration"
echo "step needed, Google Pay works over plain localhost. Do as many Google"
echo "Pay attempts as you want; each page load/reload starts a new session,"
echo "and every ev:google-pay:* measurement is recorded automatically."
echo
echo "Recorded rows print below as they land in $RESULTS_CSV."
echo "Ctrl+C when you're done."
echo

tail -n 0 -f "$RESULTS_CSV" &
TAIL_PID=$!

# A bare `wait` would keep the script alive after the dev servers died,
# leaving a setup that looks healthy but isn't. macOS ships bash 3.2, which
# has no `wait -n`, so poll instead and tear down on the first death.
while :; do
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "The dev servers exited (PID $DEV_PID) — tearing down." >&2
    exit 1
  fi
  sleep 5
done
