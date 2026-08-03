---
"@evervault/ui-components": patch
---

Fix 3DS iframe post guards in BrowserFingerprint and ChallengeFrame to key on the full next action (data/creq and url) instead of a single field, so a retry with a new url posts again instead of being silently skipped.
