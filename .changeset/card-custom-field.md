---
"@evervault/ui-components": minor
---

Render the `field` nodes of a declared card as the customer's own inputs, in declared order among the card fields, keeping what was typed across patches.

- The input has the id `field-<name>`; themes can target its field as `[ev-name="field-<name>"]`.
- Takes `label`, `placeholder`, `tooltip`, `autofocus` and `defaultvalue` like the card fields.
- Carries `type` (`text`, `email`, `tel`, `url`, `number` or `date`), `inputmode`, `readonly`, `autocapitalize`, `spellcheck`, `enterkeyhint`, `maxlength`, `min`, `max` and `step` onto the input.
- `autocomplete` takes a browser token (`"postal-code"`), turns autofill on bare or with `"true"`, and off with `"off"` or `"false"`.
- A field without a name, a second field with the same name, and an unsupported `type` (rendered as text) are warned about.
- Focus, blur and key events name the field as `{ field: "field", name }`.
