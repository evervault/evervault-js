---
"@evervault/browser": minor
"@evervault/js": minor
---

Add `transactionType` to the Apple Pay web `process()` payload (`oneOff`, `recurring`, or `disbursement`) based on the transaction category. `paymentDataType` continues to reflect the Apple token format returned by the credentials API (e.g. `3DSecure`).
