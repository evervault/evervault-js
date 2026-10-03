---
"@evervault/ui-components": minor
---

Report the customer's own fields in the card payload under `fields`, by name, each value encrypted like the card number so no field can be used to read what is typed into it. An empty field is `null` and a field that leaves the tree is dropped. Typing reports a `change`; seeding a `defaultvalue` does not.
