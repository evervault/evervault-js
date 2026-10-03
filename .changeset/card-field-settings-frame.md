---
"@evervault/ui-components": minor
---

Apply the card's settings to each field they name. `autoProgress` and `autoComplete` are read per field, with a field's own `autoprogress` or `autocomplete` winning, an expiry half falling back to `expiry`, and the customer's fields read under `fields`. A customer's field with a `maxlength` auto-progresses once it is full. The card fields read `autoprogress` and `errormessage`, the card number `unsupportedbrandmessage`, the security code `allow3digitamex`, and the cardholder `pattern`. `translations.fields`, `validation.fields` and `defaultValues.fields` fill in each customer's field that does not declare its own.
