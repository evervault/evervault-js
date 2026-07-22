---
"@evervault/browser": minor
"@evervault/js": minor
---

Add Apple Pay coupon code support on the web SDK (`supportsCouponCode`, `couponCode`, `onCouponCodeChange`). Merchants can update totals when the customer changes a coupon on the sheet, and optionally return `error` (`couponCodeInvalid` / `couponCodeExpired`) to surface validation feedback in the native Apple Pay UI.
