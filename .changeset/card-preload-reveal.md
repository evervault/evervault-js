---
"@evervault/browser": minor
---

Add `card.preload(selector)` and `card.reveal()`, which separate booting the card iframe from showing it: `preload()` boots it hidden in its container, `reveal()` shows it later with no DOM move. Useful when the card sits behind a later checkout step.

Both are opt-in; `mount()` is unchanged and throws if called on a preloaded card. `reveal()` without a prior `preload()` throws.
