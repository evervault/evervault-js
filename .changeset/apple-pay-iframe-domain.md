---
"@evervault/browser": patch
---

Resolve the Apple Pay merchant-validation domain from the top-level document origin (`window.location.ancestorOrigins`) instead of the current frame's origin. This fixes Apple Pay failing with "Payment Not Completed" when the component runs inside a cross-origin iframe (e.g. a PSP-hosted widget embedded in a merchant store), where the merchant session was previously issued for the iframe host rather than the top-level merchant origin. Falls back to the current frame's origin when not embedded.
