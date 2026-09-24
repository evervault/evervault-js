---
"@evervault/browser": patch
---

Wire up `EV_ERROR` handling for `Card`, `Pin`, `GooglePay`, `RevealText`, and `RevealCopyButton` so a failed component chunk load (introduced by ui-components' code-splitting) surfaces as their `error` event instead of failing silently. `RevealText` did not previously expose an `on()` method or any events; it now exposes `on("error", ...)`.
