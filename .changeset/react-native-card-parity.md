---
"@evervault/react-native": minor
---

Bring the card's building blocks in line with the web and React cards. Every addition is optional, and a card using none of them renders and behaves as before.

- `Card.Row` places the fields inside it side by side, sharing its width.
- `Card.ExpiryMonth` and `Card.ExpiryYear` declare the expiry as two fields, writing the one expiry the payload reports; an invalid date is reported as `errors.expiry`. Leaving a half checks the date, unless focus moves into the other half while it is empty. `Card.Expiry` keeps working as the combined field.
- A card declaring one expiry half without the other, or `Card.Expiry` alongside a half, logs an error and keeps the fields it last could render, which is none if it never could.
- A field declared twice renders only the first, as does a `Card.Field` name declared twice; the card warns about each one it leaves out, and about a `Card.Field` without a name, which it leaves out too.
- `Card.Field` collects a value of the app's own, reported encrypted in the payload's `fields` under its `name`, or null while empty or invalid. `required`, `minLength`, `maxLength` and `pattern` validate it, with `errorMessage` replacing the default message in `errors.fields`. Changing those rules drops the value typed under the old ones, and its error. A card without one reports no `fields`.
- `label` on any field renders its text above the field, styled by `labelStyle`, and reads it out as the field's accessibility label.
- `autoProgress` on `Card` moves focus to the next field once one is filled, along the order the fields first rendered in, whatever views wrap them; a field rendered later joins the end. It is off unless set.
- `autoProgress` on `Card.Number`, `Card.Expiry`, `Card.ExpiryMonth`, `Card.ExpiryYear`, `Card.Cvc` and `Card.Field` turns auto-advance on or off for that field, over the card's. A `Card.Field` moves on once it holds its `maxLength`; `Card.Holder`, with no length to fill, never does.
- `errorMessage` on a card field replaces the text of its error in `errors`; either expiry half may declare the expiry's. `Card.Number`'s `unsupportedBrandMessage` replaces the text for a brand the card does not accept.
- `pattern` on `Card.Holder` is a pattern the whole name must match. `optional` on `Card.Cvc` completes the card without a security code, and `allow3DigitAmex={false}` refuses a 3-digit American Express one.
- The security code is judged against the card number, as on the web: its length follows the number's brand, and it is invalid while a number is typed but not valid.
