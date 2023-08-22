---
"@evervault/inputs": patch
---

Correct inputs' parsing of its form overrides. Previously explicitly set defaults (i.e. false for disabling fields) were treated as true due to a bad type check. This issue is now resolved.
