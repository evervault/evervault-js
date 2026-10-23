---
"@evervault/browser": patch
"@evervault/js": patch
---

Apple Pay web: fix "show() must be triggered by user activation" in Safari on slow connections. The button now fetches the merchant details when it mounts and opens the sheet on the click. `prepareTransaction` now runs after the sheet opens, and its amount and line items appear on the sheet when it resolves. A rejected `prepareTransaction` now fires the `error` event, and a second click while the sheet is open is ignored.
