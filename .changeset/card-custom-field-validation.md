---
"@evervault/ui-components": minor
---

Validate the customer's own fields like the browser validates an input:

- `required` rejects an empty field, `pattern` must match the whole value, and `minlength`/`maxlength` bound its length.
- An `email` or `url` field must hold one. A `number` or `date` field must be within `min`/`max` and on a `step` from `min` (1 by default, `"any"` for none, days for a date); `pattern` and the lengths do not apply to it.
- A `readonly` field is not validated. A bound, length or pattern that does not parse is ignored, and an invalid pattern is warned about.

As on the card fields, an error shows once the field is left, follows the value until it clears, and shows on every field when the card is validated. The copy is "This field is required" or "Please enter a valid value", unless the field declares an `errormessage`. An invalid field is reported as `null` with its error under `errors.fields`. The card stays valid, since `isValid` only concerns the card fields, but neither it nor the agent tools report it complete until every field is valid.

Changing a field's validation rules, or declaring it again with other ones, clears what was typed into it, so a value is only ever judged by the rules it was typed under. The card fields keep their own fixed validation, whatever attributes they declare.
