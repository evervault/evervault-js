---
"@evervault/browser": minor
"types": minor
---

Expose `payerName`, `payerEmail` and `payerPhone` on the Apple Pay `process()` payload when `requestPayerDetails` is set. Safari returns these on the top-level `PaymentResponse`; they were previously only reachable through `shippingContact`, which Apple Pay uses to carry the requested payer fields.
