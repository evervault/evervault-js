---
"@evervault/browser": minor
"@evervault/js": minor
---

Add Apple Pay shipping methods and shipping type on the web SDK (`shippingMethods`, `shippingType`, `onShippingMethodSelected`). Merchants can offer selectable shipping options on one-off payment sheets; selecting a method recomputes totals (via the merchant callback or an internal amount adjustment) and the chosen method is returned on the `process()` payload as `shippingMethod`.
