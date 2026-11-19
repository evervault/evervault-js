---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
"@evervault/ui-components": minor
---

Add a `threeDSProfiling` option to the Card: `ui.card({ threeDSProfiling: true })`, the `threedsprofiling` attribute on `<ev-card>`, and the `threeDSProfiling` prop on the React `<Card>`. With the option, the Card profiles the browser for 3D Secure when the shopper enters a valid card number. It collects the browser details and runs the card issuer's 3DS Method in a hidden frame. It then sends `threeDSProfilingId` in a `change` event. Pass this ID as the `profilingId` query parameter when you create the 3DS session (`POST /payments/3ds-sessions?profilingId=...`), so the session can skip its own browser check. If profiling fails or is off for the app, `threeDSProfilingId` stays `null` and 3D Secure works as before.
