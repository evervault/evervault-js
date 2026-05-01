---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
---

Expose `card.paymentMethodType` on the Apple Pay and Google Pay payloads. The value is one of `"credit"`, `"debit"`, `"prepaid"`, or `"store"` and reflects the funding type of the card the user selected in their wallet. For Apple Pay it is sourced from `ApplePayPaymentMethod.type`; for Google Pay from `CardInfo.cardFundingSource`. This helps distinguish the selected funding type more reliably than BIN-derived fields, which can return `credit` for dual-network cards even when the user selected their debit card.
