---
"@evervault/browser": patch
"@evervault/js": patch
"@evervault/ui-components": patch
---

3D Secure: the overlay window now stays hidden while the session runs, and shows only when the issuer asks for a challenge, or after 1.5 seconds if no result has come back. A frictionless payment no longer shows a loading window. When the server reports success, the `success` event now fires straight away, and the outcome is reported in the background.
