---
"@evervault/browser": patch
---

Fix Apple Pay availability when multiple buttons are created before Apple's SDK loads. Also report failed Apple Pay credential exchanges through the `error` event and fail the payment sheet.
