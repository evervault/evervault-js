---
"@evervault/ui-components": patch
---

Remove the inline importmap and inline component preload script from index.html. Both are blocked by the ui-components CSP, which has no `unsafe-inline` for `script-src`, so neither ran in production. The preload script is now emitted as an external file with its own `integrity` attribute, and it carries the SRI hash for each chunk it preloads so `modulepreload` enforces integrity on code split chunks. Static `modulepreload` links in index.html now get an `integrity` attribute too.
