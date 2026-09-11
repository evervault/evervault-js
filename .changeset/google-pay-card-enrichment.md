---
"@evervault/browser": minor
"@evervault/js": minor
---

Surface Google Pay card enrichment (`funding`, `segment`, `country`, `currency`, `issuer`) on the `card` object in the `process()` payload. These fields were already sent by the backend but were not previously exposed on the `EncryptedGooglePayData` type.
