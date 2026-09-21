---
"@evervault/react": minor
---

Add a `preload` prop and `reveal()` ref method to `<Card>`, mirroring `@evervault/browser`'s `card.preload()`/`card.reveal()`. Pass `preload` to boot the card hidden on mount, then call `ref.current.reveal()` to show it.
