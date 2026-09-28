---
"@evervault/browser": minor
---

Give `<ev-card>` what `ui.card()` offers:

- The card's `ready`, `error`, `complete`, `swipe`, `validate`, `focus`, `blur`, `keydown` and `keyup` events are dispatched on the element, carrying the same payload as `ui.card()`'s, as `event.detail`. Unlike `change`, they do not bubble: only listeners on the `<ev-card>` itself hear them, so page-wide focus and keyboard handlers never receive them.
- `card.validate()` checks the fields; the result arrives as a `validate` event.
- `icons`, `autoFocus`, `translations`, `acceptedBrands`, `customBrands`, `defaultValues`, `autoComplete`, `redactCVC`, `allow3DigitAmexCVC`, `validation` and `agentTools` can be set as properties of the element, taking the values `ui.card()` accepts. A property changed on a mounted card applies to it, except `agentTools`, which is read when the card mounts. Properties set before the element upgraded are kept.
