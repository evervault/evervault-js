---
"@evervault/browser": patch
"@evervault/ui-components": patch
---

Guard `postMessage`/`BroadcastChannel` message listeners in `EvervaultFrame`, `useMessaging`, and `useBroadcastChannel` against events with `null`/`undefined` `data`, preventing a crash when any other script on the page (browser extension, ad/analytics snippet, etc.) posts a message to the window.
