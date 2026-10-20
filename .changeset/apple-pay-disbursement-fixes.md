---
"@evervault/browser": minor
"@evervault/js": minor
---

Apple Pay web: fix disbursement sheets.

- **Amounts are now in cents**, the same as payments and recurring transactions. This covers the transaction `amount`, `lineItems`, and `instantTransfer.amount`. Previously they were shown as given, so `amount: 1000` showed as $1000 on a disbursement and $10 on a payment. **If you create disbursements, multiply your amounts by 100** (for example `amount: 22.91` becomes `amount: 2291`) to keep the same values on the sheet.
- Disbursements with `lineItems` now open the sheet and show each line. Before, the sheet failed to open.
- The payout line now shows your `priceLabel`, or your merchant name, instead of "Apple Pay Demo".
- Updates returned from `onPaymentMethodChange` now keep the payout line, so the sheet stays open and shows the new amount. Before, the sheet closed as soon as it opened, because Apple Pay fires a payment method change for the default card.
