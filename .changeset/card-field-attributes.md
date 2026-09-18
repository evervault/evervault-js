---
"@evervault/ui-components": minor
---

Map the remaining per-field card options onto attributes of the `<ev-card-*>` elements, so a declared card no longer has to reach for the config object to set them:

- `autocomplete` on any field element, spelled the HTML way: `<ev-card-number autocomplete="off">` turns the browser's autofill off for that field.
- `autofocus` on any field element focuses it when the card renders, and `autofocus="false"` keeps focus away from it. A card declaring `autofocus` settles its own focus, so `config.autoFocus` no longer applies to it; declaring it on more than one field focuses the first of them, and focus never moves once the customer has started on the card.
- `redact` on `<ev-card-cvc>` masks the security code as it is typed.
- `optional` on `<ev-card-cvc>` accepts the card with an empty security code.
- `default-value` on `<ev-card-holder>` fills the cardholder name in. It seeds the field rather than binding it: a changed default applies while the field is untouched, but never replaces a name the customer has typed, and seeding reports no `change` of its own. Hosts that want the name bound to their own state have `card.update({ defaultValues: { name } })`.

The boolean attributes follow the HTML convention: declaring one is enough to turn it on (`<ev-card-cvc redact>`), and only an explicit `="false"` turns it off. `autocomplete` also accepts `"off"`.

A declared attribute wins over the same option on the config object for that field. Cards that declare no children, or declare a field without the attribute, keep taking the value from the config exactly as before.
