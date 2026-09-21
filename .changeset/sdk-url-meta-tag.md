---
"@evervault/ui-components": minor
---

The frame reads its SDK, keys and API URLs from an `evervault:config` meta tag so the custom domain worker can rewrite them per host, falling back to the build-time defaults when the tag is missing or invalid.
