#!/usr/bin/env bash
# CARD-993 baseline-capture helper for Apple Pay render latency.
# Not part of the shipped SDK — local dev tooling only, safe to delete anytime.
#
# Delegates all tunnel/dev-server setup to ../run-tunnel.sh (see
# examples/apple-pay/README.md for one-time ngrok setup and troubleshooting)
# — this script only adds an interactive round-by-round latency capture loop
# on top: for each manual Apple Pay attempt, paste the performance.measure()
# entries copied from devtools and it appends timestamped rows to
# results.csv.
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

cleanup() {
  rm -f "$TUNNEL_LOG"
  if [[ -n "$TUNNEL_PID" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo
    echo "Stopping run-tunnel.sh..."
    # SIGINT (not TERM/KILL) so run-tunnel.sh's own `trap 'exit 130' INT` runs
    # its normal EXIT-trap teardown (ngrok, dev server, port) exactly as if the
    # user had pressed Ctrl+C on it directly — measure.sh must not duplicate
    # that teardown logic itself.
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
  echo "timestamp,browser,round,measure,duration_ms" >"$RESULTS_CSV"
fi

echo
echo "=========================================================="
echo " App:              $APP_URL"
[[ -n "$MERCHANT_HOST" ]] && echo " Merchant domain:   $MERCHANT_HOST"
echo "=========================================================="
echo
echo "For each measurement round:"
echo "  1. Open $APP_URL in Safari, or in desktop Chrome for the phone-QR"
echo "     remote-continuity flow."
echo "  2. Do the flow you want to measure (page load mounts the button;"
echo "     tap through the sheet with a Wallet card — or scan the QR code on"
echo "     your phone — for the other spans)."
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
    echo "$ts,$browser,$round,$line" >>"$RESULTS_CSV"
  done

  round=$((round + 1))
done

echo
echo "Saved results to $RESULTS_CSV"
