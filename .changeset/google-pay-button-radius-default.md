---
"@evervault/ui-components": minor
---

Default the Google Pay button corner radius to 12 to match pay.js and the Android SDK, which previously rendered 4 on web and 100 on Android. The fallback now uses `??`, so `borderRadius: 0` gives square corners instead of being treated as unset.
