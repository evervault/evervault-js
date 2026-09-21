---
"@evervault/browser": minor
---

Add `card.preload(selector)` and `card.reveal()`, which separate booting the card iframe from showing it: `preload()` boots it hidden in its container, `reveal()` shows it later with no DOM move. Used in stepped payment experiences.

Both are opt-in. `reveal()` without a prior `preload()` throws.
