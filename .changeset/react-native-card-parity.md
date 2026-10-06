---
"@evervault/react-native": minor
---

Bring the card's building blocks in line with the web and React cards. Every addition is optional, and a card using none of them renders and behaves as before.

- `Card.Row` places the fields inside it side by side, sharing its width.
- `Card.ExpiryMonth` and `Card.ExpiryYear` declare the expiry as two fields, writing the one expiry the payload reports; an invalid date is reported as `errors.expiry`. The month takes 01 to 12, a single digit above 1 filling it as `0` and that digit, and a year filled in as four digits is cut to two. Leaving a half checks the date, unless focus moves into the other half while it is empty. `Card.Expiry` keeps working as the combined field.
- A card declaring one expiry half without the other, or `Card.Expiry` alongside a half, logs an error and keeps the fields it last could render, which is none if it never could.
- A field declared twice renders only the first, as does a `Card.Field` name declared twice; the card warns about each one it leaves out, and about a `Card.Field` without a name, which it leaves out too. A field's settings come from the first field of its kind.
- `Card.Field` collects a value of the app's own, reported encrypted in the payload's `fields` under its `name`, whatever the name, or null while empty or invalid. `type` (`text`, `email`, `tel`, `url` or `number`), `required`, `minLength`, `maxLength`, `pattern`, `min`, `max` and `step` validate it as the web's `<ev-field>` does, with `errorMessage` replacing the default message in `errors.fields`, reported when the card's `validationMode` would report a card field's error; a read-only field is never invalid. A length that isn't a whole number is ignored, and a pattern that isn't a valid regular expression is ignored with a warning. Changing those rules drops the value typed under the old ones, and its error. A card without one reports no `fields`.
- `defaultValue` on `Card.Holder` and `Card.Field` starts the field with that value, and `reset()` fills it in again; a changed default replaces only a value the shopper hasn't changed.
- `label` on any field renders its text above the field, styled by `labelStyle`, and reads it out as the field's accessibility label.
- `autoProgress` on `Card` moves focus to the next field once one is filled, along the order the fields first rendered in, whatever views wrap them; a field rendered later joins the end. It is off unless set.
- `autoProgress` on any card field turns auto-advance on or off for that field, over the card's. A `Card.Field` moves on once it holds its `maxLength`, and never without one. `Card.Holder`, with no length to fill, never does.
- `errorMessage` on a card field replaces the text of its error in `errors`; either expiry half may declare the expiry's, the later one's first, as on the web. `Card.Number`'s `unsupportedBrandMessage` replaces the text for a brand the card does not accept.
- `pattern` on `Card.Holder` is a pattern the whole name must match. `optional` on `Card.Cvc` completes the card without a security code, and `allow3DigitAmex={false}` refuses a 3-digit American Express one.
- The security code is judged against the card number, as on the web: its length follows the number's brand, and it is invalid while a number is typed but not valid.
