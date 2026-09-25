#!/usr/bin/env bash
# CARD-993 baseline-capture helper for Apple Pay render latency.
# Not part of the shipped SDK — local dev tooling only, safe to delete anytime.
#
# Delegates all tunnel/dev-server setup to ../run-tunnel.sh (see
# examples/apple-pay/README.md for one-time ngrok setup and troubleshooting).
# The example's own window.__evervault_rum__ hook (src/perf-rum.ts) posts
# each ev:apple-pay:* measurement straight to a dev-server endpoint
# (vite.config.ts) that appends to results.csv — no devtools copy/paste
# needed. Just open the app and do as many Apple Pay attempts as you want
# (each page load/reload is a new session), then Ctrl+C here when done.
#
# Usage:
#   ./measure.sh
#   NGROK_DOMAIN=abc123xyz.ngrok-free.dev NGROK_BASIC_AUTH=user:pass ./measure.sh
#   (both optional — forwarded straight through since run-tunnel.sh already
#   reads them from its own environment; no explicit passthrough needed here)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_TUNNEL="$SCRIPT_DIR/../run-tunnel.sh"
RESULTS_CSV="$SCRIPT_DIR/results.csv"
TUNNEL_LOG="$(mktemp)"

TUNNEL_PID=""
TAIL_PID=""

cleanup() {
  if [[ -n "$TAIL_PID" ]] && kill -0 "$TAIL_PID" 2>/dev/null; then
    kill "$TAIL_PID" 2>/dev/null || true
  fi
  rm -f "$TUNNEL_LOG"
  if [[ -n "$TUNNEL_PID" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo
    echo "Stopping run-tunnel.sh..."
    # SIGINT (not TERM/KILL) so run-tunnel.sh's own `trap 'exit 130' INT` runs
    # its normal EXIT-trap teardown (ngrok, dev server, port) exactly as if
    # the user had pressed Ctrl+C on it directly — measure.sh must not
    # duplicate that teardown logic itself.
    kill -INT "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting run-tunnel.sh..."
"$RUN_TUNNEL" >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

echo "Waiting for the tunnel and dev server..."
for _ in $(seq 1 90); do
  if grep -q "^Ready\. Open " "$TUNNEL_LOG"; then
    break
  fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "run-tunnel.sh exited before becoming ready:" >&2
    cat "$TUNNEL_LOG" >&2
    exit 1
  fi
  sleep 1
done

if ! grep -q "^Ready\. Open " "$TUNNEL_LOG"; then
  echo "Timed out waiting for run-tunnel.sh to become ready. Log:" >&2
  cat "$TUNNEL_LOG" >&2
  exit 1
fi

APP_URL=$(grep -m1 "^Tunnel ready: " "$TUNNEL_LOG" | sed 's/^Tunnel ready: //')
MERCHANT_HOST=$(grep -A1 "^Register this domain" "$TUNNEL_LOG" | tail -1 | sed 's/^ *//')

if [[ ! -f "$RESULTS_CSV" ]]; then
  echo "timestamp,browser,session,measure,duration_ms" >"$RESULTS_CSV"
fi

echo
echo "=========================================================="
echo " App:              $APP_URL"
[[ -n "$MERCHANT_HOST" ]] && echo " Merchant domain:   $MERCHANT_HOST"
echo "=========================================================="
echo
echo "Open $APP_URL in Safari, or in desktop Chrome for the phone-QR"
echo "remote-continuity flow. Do as many Apple Pay attempts as you want —"
echo "each page load/reload starts a new session, and every ev:apple-pay:*"
echo "measurement is recorded automatically. No devtools copy/paste needed."
echo
echo "Recorded rows print below as they land in $RESULTS_CSV."
echo "Ctrl+C when you're done."
echo

tail -n 0 -f "$RESULTS_CSV" &
TAIL_PID=$!

wait "$TUNNEL_PID"
