---
"@evervault/browser": patch
---

Replace the 100ms `setInterval` poll in `ApplePayButton`'s script-load wait with the SDK script's own `onload` event, removing up to ~100ms of artificial latency from `availability()`/`mount()`.
