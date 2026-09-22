---
"@evervault/js": minor
---

`@evervault/js` no longer injects the browser SDK when the module is imported. The bundle is fetched on the first `loadEvervault` call, matching `@evervault/react`, so importing the package no longer races a script the page or a custom `jsSdkUrl` provides.
