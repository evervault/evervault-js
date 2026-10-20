---
"@evervault/browser": minor
"@evervault/js": minor
---

Apple Pay web: `onShippingAddressChange`, `onShippingMethodSelected`, `onPaymentMethodChange`, and `onCouponCodeChange` can now also update a recurring transaction's subscription terms, via a new optional `recurringPaymentRequest` field on the value they return. It accepts the transaction's `description`, `regularBilling`, `trialBilling`, and `managementURL`; any field left out falls back to the original transaction's value. If an update leaves out `recurringPaymentRequest`, the sheet keeps the terms from the last update, so return it whenever the terms change, including when they change back to the original ones. `billingAgreement` can't be changed, as Apple Pay cancels the sheet if it changes after opening.

```js
onCouponCodeChange: async (couponCode) => {
  const monthlyAmount = await applyCoupon(couponCode); // in cents
  return {
    amount: monthlyAmount,
    recurringPaymentRequest: {
      // decimal, same as when creating the transaction
      regularBilling: { label: "Monthly", amount: monthlyAmount / 100 },
    },
  };
};
```

`recurringPaymentRequest` only applies to recurring transactions — if returned for a one-off payment or a disbursement, it's dropped and a warning is logged, but the rest of the update still applies.
