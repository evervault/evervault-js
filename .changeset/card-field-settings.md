---
"@evervault/browser": minor
---

Make the per-field card options name every field. `autoProgress` and `autoComplete` take `true`/`false` for every field or a map by field — `name`, `number`, `expiry`, `expiryMonth`, `expiryYear`, `cvc`, and `fields` for the customer's own fields, as one value or each by name — so `ui.card({ autoProgress: { number: true } })` moves on from the card number only. An expiry half takes its own key, then `expiry`. `translations.fields`, `validation.fields` and `defaultValues.fields` set the customer's fields by name. The existing shapes keep working unchanged.
