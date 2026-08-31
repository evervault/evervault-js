---
"@evervault/ui-components": patch
---

Omit `billingAddressParameters` from the Google Pay request when `billingAddressRequired` is false. Google ignores the field in that case, so no merchant behaviour changes, and the request now matches what the Android SDK emits.
