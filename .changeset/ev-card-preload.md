---
"@evervault/browser": minor
---

Preload a declared `<ev-card>` hidden with the `preload` attribute or property, then show it with `card.show()`, as with `ui.card()`'s `preload()` and `show()`. `preload` is read once, when the card mounts. Calling `show()` before the card has mounted mounts it shown.
