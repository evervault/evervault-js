---
"@evervault/browser": minor
---

Declare the customer's own fields inside `<ev-card>` with `<ev-field name="…">`, placed among the card fields, instead of a separate input styled to match. The card's `focus`, `blur`, `keydown` and `keyup` events name one as `{ field: "field", name }`, so its name can never be mistaken for a card field.
