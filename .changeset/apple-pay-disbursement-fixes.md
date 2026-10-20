---
"@evervault/browser": patch
"@evervault/js": patch
---

Apple Pay web: fix disbursement sheets.

- Disbursements with `lineItems` now open the sheet and show each line. Before, the sheet failed to open.
- The payout line now shows your `priceLabel`, or your merchant name, instead of "Apple Pay Demo".
- Updates returned from `onPaymentMethodChange` now keep the payout line, so the sheet stays open and shows the new amount. Before, the sheet closed as soon as it opened, because Apple Pay fires a payment method change for the default card.
- The payout amount no longer shows floating-point error after subtracting an `instantTransfer` fee (for example `10.2` instead of `10.200000000000001`).

Disbursement amounts are decimal (for example `amount: 22.91`), unlike payments and recurring transactions, which are in cents. This applies to the transaction `amount`, `lineItems`, `instantTransfer.amount`, and the `amount` returned from `onPaymentMethodChange`.
