---
"@evervault/browser": patch
---

Surface a failed Apple Pay credentials exchange on the `error` event instead of throwing an uncaught `TypeError` out of the click handler. `POST /frontend/apple-pay/credentials` responses are now checked for a non-2xx status and for missing card credentials, so an API failure reaches the merchant's error handler with the API's detail and status, and the Apple Pay sheet is completed as failed rather than left spinning until Apple times it out. Previously the error body was returned as if it were a successful exchange and the handler died on `card.displayName`, so no error event fired at all.
