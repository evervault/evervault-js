---
"@evervault/browser": minor
"@evervault/js": minor
---

Expose `applePay.abort()` to programmatically dismiss an active Apple Pay session. This maps to `PaymentRequest.abort()` under the hood and fires the `cancel` event when the sheet is closed. Useful when a shipping address change requires a different currency and the merchant needs to close and reopen Apple Pay with updated transaction details.
