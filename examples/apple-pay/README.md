# Apple Pay example

An example that uses `@evervault/browser` to mount an Apple Pay button via
[Evervault UI Components](https://docs.evervault.com/primitives/ui-components),
with coupon-code support and prefilled billing/shipping contacts.

Run it locally with `pnpm dev` (serves on `https://localhost:4000`). Apple
Pay availability and the payment sheet only work in Safari with a Wallet
card, and Apple Pay's merchant-domain validation only works over a
publicly-reachable HTTPS domain — plain `localhost` isn't enough for that
part. `run-tunnel.sh` spins up a public tunnel for exactly this so you can
test on iOS Safari / a real device.

This tunnel setup is apple-pay-specific: Apple's Wallet/PassKit servers
fetch `apple-developer-merchantid-domain-association` over the public
internet to validate the merchant domain, which none of the other payment
examples in this repo require (Google Pay works over `localhost`, and the
3D Secure challenge is an in-page iframe, not an external redirect).

## One-time setup

This part is manual and touches your own accounts/credentials, so it isn't
scripted:

1. Install ngrok: `brew install --cask ngrok`
2. Sign up at [dashboard.ngrok.com](https://dashboard.ngrok.com) and copy
   your authtoken, then run `ngrok config add-authtoken <token>`.
3. (Optional) Claim a free reserved dev domain in the ngrok dashboard
   (Universal Gateway → Domains) — looks like `abc123xyz.ngrok-free.dev` —
   and get it Apple-verified for the merchant ID. The
   `apple-developer-merchantid-domain-association` file is already checked
   in under `public/.well-known/` and gets served automatically, so once
   the domain is registered there's nothing else to upload.
4. Copy the repo-root `.env.example` to `.env` and fill in the sandbox
   `VITE_EV_TEAM_UUID`, `VITE_EV_APP_UUID`, and `VITE_MERCHANT_ID` values.

## Running with a public tunnel

```bash
pnpm dev:tunnel
# or, from the repo root:
pnpm examples:apple-pay:tunnel
```

This starts `packages/browser`, `packages/ui-components`, and this example,
tunnels all three through one ngrok session, and rewrites the repo-root
`.env` with the fresh tunnel URLs before starting the app. It prints:

- The app's public URL — register this exact hostname under the merchant's
  `applePay.domains` (unless you set `NGROK_DOMAIN`, this changes every run).
- The ui-components / browser bundle tunnel URLs (informational only).

Open the printed app URL in Safari on a real iOS device or the Simulator
(with a Wallet test card added) to test the actual payment sheet.

### Personal env vars

These are tied to your own ngrok account, not the shared app config in
`.env` — export them in your own shell profile, or pass them inline:

- `NGROK_DOMAIN` — pin the app tunnel to your reserved domain (from step 3
  above) instead of a fresh ephemeral one each run. Recommended once
  you've registered a domain with Apple, since re-registering a new
  ephemeral hostname every run gets old fast.
- `NGROK_BASIC_AUTH` — `user:pass` to put basic-auth in front of the app
  tunnel, if you want to keep the public URL a bit more private.

```bash
NGROK_DOMAIN=abc123xyz.ngrok-free.dev pnpm dev:tunnel
```

## Tearing down

Ctrl+C the running script. It restores the repo-root `.env` and all three
vite configs to their original contents and kills every process it
started — nothing is left running or rewritten.

## Troubleshooting

- **`ERR_NGROK_108`** — another ngrok agent session is already running
  (the free plan allows only one at a time). Run `pkill -x ngrok` and
  retry, or check [the dashboard](https://dashboard.ngrok.com/endpoints).
- **Apple Pay button doesn't mount / availability is `unavailable`** — this
  is expected outside Safari, or in Safari without a Wallet test card
  added on that device/Simulator.
- **Merchant validation fails** — the tunnel's hostname isn't registered
  under the merchant's `applePay.domains` yet, or (if using an ephemeral
  ngrok URL) it changed since you last registered it.
