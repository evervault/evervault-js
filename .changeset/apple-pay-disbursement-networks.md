---
"@evervault/browser": patch
"@evervault/js": patch
---

Apple Pay web: fix disbursements failing to open the payment sheet when `allowedCardNetworks` isn't set. They now default to Visa, Mastercard, Amex, and Discover, the same as payments and recurring transactions.
