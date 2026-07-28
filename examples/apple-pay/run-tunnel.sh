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

