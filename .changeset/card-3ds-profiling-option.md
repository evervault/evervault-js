---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
"@evervault/ui-components": minor
---

Add a `threeDSProfiling` option to the Card: `ui.card({ threeDSProfiling: true })`, the `threedsprofiling` attribute on `<ev-card>`, and the `threeDSProfiling` prop on the React `<Card>`. The card values now include `threeDSProfilingId`. The option has no effect yet, and `threeDSProfilingId` is always `null`. A later release uses them to profile the browser for 3D Secure while the shopper types.
