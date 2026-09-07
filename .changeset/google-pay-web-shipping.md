---
"@evervault/browser": minor
"@evervault/js": minor
---

Add Google Pay shipping address and shipping option collection on web. `shippingAddress` and `shippingOptions` configure the sheet, `onShippingAddressChange` and `onShippingOptionChange` update the total, line items and options while the sheet is open, and the buyer's choice is surfaced on the `process()` payload as `shippingAddress` and `shippingOptionId`.
