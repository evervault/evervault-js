---
"@evervault/ui-components": patch
---

Add a `%%CSP_NONCE%%` placeholder on the generated importmap script's `nonce` attribute. The importmap injected for SRI on dynamically imported chunks is an inline script, which strict `script-src` CSPs (no `unsafe-inline`) reject outright, breaking Card. The serving layer must replace the placeholder with a real per-response nonce and add the same nonce to its CSP header.
