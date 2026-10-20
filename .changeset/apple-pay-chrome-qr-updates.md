---
"@evervault/browser": patch
"@evervault/js": patch
---

Apple Pay web: fix sheet updates when paying in Chrome by scanning the QR code with an iPhone. `onShippingAddressChange` now fires when the customer changes their address, and the totals returned by `onShippingAddressChange`, `onShippingMethodSelected`, `onPaymentMethodChange`, and `onCouponCodeChange` now show on the sheet instead of the original amounts.
