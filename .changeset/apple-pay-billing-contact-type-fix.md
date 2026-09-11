---
"@evervault/browser": minor
"@evervault/js": minor
---

Fix `EncryptedApplePayData.billingContact`/`shippingContact` types to match the actual shape returned by Apple Pay on the web: address fields (`addressLines`, `administrativeArea`, `country`, `countryCode`, `locality`, `postalCode`, `subAdministrativeArea`, `subLocality`) are flat on the contact object, not nested under an `address` key. These fields were already sent by the browser but were not previously exposed on the `EncryptedApplePayData` type.

Also removes an unused `buildAddressObject` helper (and its supporting `DisbursementContactDetails`/`DisbursementContactAddress` types) left over from a disbursement billing-contact flow that was replaced by the `requiredRecipientDetails` recipient-contact model.
