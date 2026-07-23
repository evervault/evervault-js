---
"@evervault/browser": patch
"@evervault/js": patch
---

Fix a crash in Apple Pay's `onshippingaddresschange` handler when `event.target` is `null`. This could happen during the desktop-Chrome + phone-QR "remote continuity" handoff, throwing `Cannot read properties of null (reading 'shippingAddress')` and leaving the sheet stuck on "Processing" until it timed out.
