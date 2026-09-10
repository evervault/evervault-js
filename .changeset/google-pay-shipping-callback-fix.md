---
"@evervault/ui-components": patch
---

Fix the Google Pay button failing on click with a `DEVELOPER_ERROR` when neither `shippingAddress` nor `shippingOptions` is configured. `onPaymentDataChanged` was registered on the payments client unconditionally, but Google requires a matching `SHIPPING_ADDRESS`/`SHIPPING_OPTION` callback intent whenever it's registered - now it's only registered when shipping is actually requested.
