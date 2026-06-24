---
"@evervault/react": patch
"@evervault/ui-components": patch
"types": patch
---

Enable partial `cardIcons` overrides. `icons` now accepts `Partial<CardIcons>` so callers can override individual card icons without supplying all of them.
