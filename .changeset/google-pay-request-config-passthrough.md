---
"@evervault/browser": minor
"@evervault/js": minor
---

Add Google Pay request config passthrough options: `checkoutOption`, `transactionId`, `totalPriceStatus`, `allowPrepaidCards`, `allowCreditCards`, `softwareInfo`, `assuranceDetailsRequired` (surfaced as `assuranceDetails` on the `process()` payload), `existingPaymentMethodRequired`, and `prefetchPaymentData`. Also adds `category` to `TransactionLineItem` for Google Pay's `displayItems[].type`.
