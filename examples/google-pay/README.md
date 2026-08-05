# Google Pay example

An example that uses `@evervault/js` to mount a Google Pay button via
[Evervault UI Components](https://docs.evervault.com/primitives/ui-components).

Unlike the [Apple Pay example](../apple-pay/README.md), there's no tunnel
step here: Google Pay's payment sheet and merchant validation both work over
plain `localhost` — Apple's tunnel exists only because Apple's Wallet/PassKit
servers need to fetch a domain-association file over the public internet,
which Google Pay has no equivalent of.

What Google Pay's button does need, though, is more than one dev server.
The Apple Pay example mounts Apple's own native `<apple-pay-button>` talking
directly to `ApplePaySession`, with no iframe involved. Google Pay's button
is an Evervault UI Component — a React component rendered inside an iframe
(`packages/ui-components`) and loaded via a separately-served SDK bundle
(`packages/browser`) — so exercising it for real needs all three running at
once:

| Package                | Port |
| ----------------------- | ---- |
| `google-pay` (this app) | 4000 |
| `@evervault/ui-components` | 4001 |
| `@evervault/browser`    | 4002 |

## One-time setup

Copy the repo-root `.env.example` to `.env` and fill in the sandbox
`VITE_EV_TEAM_UUID`, `VITE_EV_APP_UUID`, and `VITE_MERCHANT_ID` values.
`VITE_KEYS_URL`, `VITE_API_URL`, `VITE_UI_COMPONENTS_URL`, and
`VITE_EVERVAULT_JS_URL` already default to the right things for local dev.

## Running locally

From the repo root:

```bash
pnpm dev
# then pick "google-pay" from the prompt
```

This starts all three dev servers listed above together (it's what
[`examples/index.js`](../index.js) does under the hood — the same picker
every example in this repo uses). Once it's up, open
[http://localhost:4000](http://localhost:4000) and click the Google Pay
button.

## Capturing latency measurements

`perf-baseline/measure.sh` starts the same three dev servers and collects
`ev:google-pay:*` render-latency measurements (`mount`, `get-app-sdk-config`,
`get-merchant`) as you click through the button — no tunnel, no
merchant-domain step, no devtools-console copy/paste. Those marks fire
inside `packages/ui-components` (the iframe), so that's also where the
RUM hook and the results-collecting dev-server endpoint live
(`packages/ui-components/src/perf-rum.ts` and `vite.config.ts`) rather than
in this example itself; `measure.sh` just points them at this directory's
`results.csv` and tails it:

```bash
pnpm perf:baseline
# or, from the repo root:
pnpm examples:google-pay:perf-baseline
```

Open the printed `http://localhost:4000` and do as many Google Pay attempts
as you want — each page load/reload starts a new session, and every
`ev:google-pay:*` measurement is recorded automatically to
`perf-baseline/results.csv` as it happens.

## Tearing down

Ctrl+C the running script. It kills all three dev servers and frees ports
4000/4001/4002, so nothing is left running.

## Troubleshooting

- **Ports already in use / dev servers fail to start** — `measure.sh` frees
  4000/4001/4002 on its way up, but if something outside this script is
  already using one of them, stop that first.
- **Google Pay button doesn't mount / stays blank** — check that all three
  dev servers actually came up (`VERBOSE=1 pnpm perf:baseline` streams their
  log live instead of only showing it on failure), and that `.env` has valid
  `VITE_EV_TEAM_UUID`/`VITE_EV_APP_UUID`/`VITE_MERCHANT_ID` values.
