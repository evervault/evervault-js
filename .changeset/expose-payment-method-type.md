---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
---

Expose `card.paymentMethodType` on the Apple Pay payload, sourced from `ApplePayPaymentMethod.type`. The value is one of `"credit"`, `"debit"`, `"prepaid"`, or `"store"` and reflects the funding type of the card the user selected in their wallet. This is useful for distinguishing the selected funding type more reliably than BIN-derived fields, which can return `credit` for cards that support both credit and debit. The field is also typed on the Google Pay payload for forward-compatibility; populating it for Google Pay requires a change to the credentials exchange endpoint and is tracked separately.
