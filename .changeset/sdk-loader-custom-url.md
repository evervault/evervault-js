---
"@evervault/js": minor
"@evervault/react": minor
---

`@evervault/js` now accepts a `jsSdkUrl` config option. Where `jsSdkUrl` is set, that bundle is always loaded rather than reusing a client already on `window`. `@evervault/react` passes the option through, so a `jsSdkUrl` given to the provider now always injects that bundle rather than reusing an existing `window.Evervault`. Concurrent loads of the same URL are shared, a script that fails to load is discarded so the next attempt retries it, and a load that never settles now times out after 15 seconds instead of leaving the promise pending.
