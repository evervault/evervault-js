---
"@evervault/react": minor
---

Declare the fields of a `<Card>` as its children. A `<Card>` with children renders the `<ev-card>` element and its `<ev-card-*>` children, so it follows the same rules as the web card. A `<Card>` without children renders from its props exactly as before.

- `Card.Holder`, `Card.Number`, `Card.Expiry`, `Card.ExpiryMonth`, `Card.ExpiryYear`, `Card.Cvc` and `Card.Field` render in the order written, and `Card.Row` places the fields inside it side by side.
- Every card field takes `label`, `placeholder`, `tooltip`, `autoComplete`, `autoFocus`, `autoProgress` and `errorMessage`, which replaces the text of its error.
- `Card.Number` also takes `iconPosition` and `unsupportedBrandMessage`, which replaces the text for a brand the card does not accept.
- `Card.Holder` also takes `defaultValue` and `pattern`, a pattern the whole name must match.
- `Card.Cvc` also takes `redact`, `optional`, which completes the card without a security code, and `allow3DigitAmex={false}`, which refuses a 3-digit American Express one.
- `Card.Field` collects a value of the app's own, reported encrypted in the payload's `fields` under its `name`. It takes `type`, `defaultValue`, `readOnly`, `inputMode`, `autoCapitalize`, `spellCheck` and `enterKeyHint`, and `required`, `minLength`, `maxLength`, `pattern`, `min`, `max` and `step` validate it.
- Children changed after the card mounted keep the details already typed, and an unsupported child is dropped with a warning.
- The card's other props and its events work as before, including `preload` and `show()` on the ref. `colorScheme`, `agentTools` and `preload` are read once, when the card mounts, and changing them later has no effect.
- Declaring children replaces `fields`. `fields`, `redactCVC`, `allow3DigitAmexCVC` and an `autoComplete` map by field are deprecated in favour of the children and their own props (`<Card.Cvc redact allow3DigitAmex />`, `autoComplete` on each field), but still work: a declared card's fields fall back on them, the expiry halves on the map's `expiry`, and a field's own prop wins.
