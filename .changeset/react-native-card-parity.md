---
"@evervault/react-native": minor
---

Bring the card's building blocks in line with the web and React cards. Every addition is optional, and a card using none of them renders and behaves as before.

- `Card.Row` places the fields inside it side by side, sharing its width.
- `Card.ExpiryMonth` and `Card.ExpiryYear` declare the expiry as two fields, writing the one expiry the payload reports; an invalid date is reported as `errors.expiry`. `Card.Expiry` keeps working as the combined field.
- `Card.Field` collects a value of the app's own, reported encrypted in the payload's `fields` under its `name`, or null while empty or invalid. `required`, `minLength`, `maxLength` and `pattern` validate it, with `errorMessage` replacing the default message in `errors.fields`. A card without one reports no `fields`.
- `label` on any field renders its text above the field, styled by `labelStyle`, and reads it out as the field's accessibility label.
- `autoProgress` on `Card` moves focus to the next field once one is filled, along the order the fields first rendered in, whatever views wrap them. It is off unless set.
