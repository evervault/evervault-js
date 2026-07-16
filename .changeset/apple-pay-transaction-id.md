---
"@evervault/browser": minor
"@evervault/js": minor
---

Surface Apple Pay's `transactionId` (from the PKPaymentToken header) on the `EncryptedApplePayData` type returned to the `process()` callback. The backend already returns this field; it was not previously exposed on the type.
