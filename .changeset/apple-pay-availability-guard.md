---
"@evervault/browser": patch
---

Fix Apple Pay availability check crashing in browsers where `ApplePaySession.applePayCapabilities` is undefined (e.g. Facebook in-app browser). The `availability()` method now returns `"unsupported"` instead of throwing a runtime error.
