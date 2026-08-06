# Apple Pay example

An example that uses `@evervault/browser` to mount an Apple Pay button via
[Evervault UI Components](https://docs.evervault.com/primitives/ui-components),
with coupon-code support and prefilled billing/shipping contacts.

Run it locally with `pnpm dev` (serves on `https://localhost:4000`). Apple
Pay availability and the payment sheet only work in Safari with a Wallet
card, and Apple Pay's merchant-domain validation only works over a
publicly-reachable HTTPS domain — plain `localhost` isn't enough for that
part. `run-tunnel.sh` spins up a public [ngrok](https://ngrok.com) tunnel for
exactly this, so you can test on iOS Safari / a real device.

This tunnel setup is apple-pay-specific: Apple's Wallet/PassKit servers
fetch `apple-developer-merchantid-domain-association` over the public
internet to validate the merchant domain, which none of the other payment
examples in this repo require (Google Pay works over `localhost`, and the
3D Secure challenge is an in-page iframe, not an external redirect).

### Why only the app is tunnelled

Apple only ever checks the app's own domain, and the Apple Pay button is
Apple's native `<apple-pay-button>` talking to `ApplePaySession` — unlike
most Evervault UI Components it mounts no iframe, so no `ui-components` dev
server is involved. The example also imports `@evervault/browser` straight
from source (see the `resolve.alias` in `vite.config.ts`), so there's no
built bundle to serve either. One tunnel, one dev server.

If a component that *does* use an iframe is added to this example — 3D
Secure, for instance — then `packages/ui-components` and the
`packages/browser` bundle would need public URLs too, via
`VITE_UI_COMPONENTS_URL` / `VITE_EVERVAULT_JS_URL`. ngrok's free plan only
grants one hostname per account, so a second provider such as
[localhost.run](https://localhost.run) would be the way to do it.

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

This starts an ngrok tunnel, then the app's dev server behind it, and prints
the public URL — register that exact hostname under the merchant's
`applePay.domains`. Nothing in the repo is modified: `.env` and the vite
configs are left alone, so an interrupted run has nothing to restore and
re-running is always safe.

Open the printed URL in Safari on a real iOS device or the Simulator (with a
Wallet test card added) to test the actual payment sheet. On ngrok's free
tier the first visit shows an "You are about to visit…" warning page — click
"Visit Site". Apple's own fetch of the domain-association file is not
affected by it.

### Personal env vars

These are tied to your own ngrok account, not the shared app config in
`.env` — export them in your own shell profile, or pass them inline:

- `NGROK_DOMAIN` — pin the app tunnel to your reserved domain (from step 3
  above) instead of a fresh ephemeral one each run. Recommended once
  you've registered a domain with Apple, since re-registering a new
  ephemeral hostname every run gets old fast.
- `NGROK_BASIC_AUTH` — `user:pass` to put basic-auth in front of the
  tunnel, if you want to keep the public URL a bit more private.
- `VERBOSE=1` — stream the dev server's log live instead of only showing it
  if the server fails to start. The default is quiet so the tunnel URL and
  the domain to register don't scroll away.

```bash
NGROK_DOMAIN=abc123xyz.ngrok-free.dev pnpm dev:tunnel
VERBOSE=1 pnpm dev:tunnel
```

## Tearing down

Ctrl+C the running script. It kills every process it started and frees port
4000, so nothing is left running. Since it never writes to the repo, there is
nothing to restore — even a `kill -9` or a dead battery leaves the working
tree clean, and the next run starts by clearing out whatever the previous one
left behind.

## Troubleshooting

- **`ERR_NGROK_4018`** — ngrok isn't authenticated (run
  `ngrok config add-authtoken <token>`).
- **`ERR_NGROK_108`** (or the tunnel never comes up) — another ngrok agent
  session is already running (the free plan allows only one at a time). The
  script kills one it finds on startup, but you can also run `pkill -x ngrok`
  and retry, or check
  [the dashboard](https://dashboard.ngrok.com/endpoints).
- **`ERR_NGROK_6024` / "You are about to visit…"** — expected on the free
  tier. Click "Visit Site"; visitors see it once per browser. It does not
  affect Apple's server-side fetch of the domain-association file.
- **Apple Pay button doesn't mount / availability is `unavailable`** — this
  is expected outside Safari, or in Safari without a Wallet test card
  added on that device/Simulator.
- **Merchant validation fails** — the app tunnel's hostname isn't
  registered under the merchant's `applePay.domains` yet, or (if using an
  ephemeral ngrok URL) it changed since you last registered it.
