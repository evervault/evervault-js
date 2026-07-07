---
"@evervault/browser": minor
"@evervault/js": minor
---

Surface Apple Pay card enrichment (`funding`, `segment`, `country`, `currency`, `issuer`) and phonetic name fields (`phoneticGivenName`, `phoneticFamilyName`) on `billingContact`/`shippingContact` in the `process()` payload. These fields were already sent by the backend and browser but were not previously exposed on the `EncryptedApplePayData` type.
