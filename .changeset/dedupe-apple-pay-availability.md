---
"@evervault/browser": patch
---

Dedupe the redundant native `ApplePaySession.applePayCapabilities()` call in `ApplePayButton`. `availability()` now memoizes its in-flight/resolved result on the instance, so calling `.availability()` before `.mount()` (the common integration pattern for driving "checking availability" UI) no longer triggers the expensive native capability probe twice per render.
