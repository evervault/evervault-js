---
"@evervault/browser": minor
"@evervault/js": minor
---

Apple Pay web: `onShippingAddressChange`, `onShippingMethodSelected`, `onPaymentMethodChange`, and `onCouponCodeChange` can now also update a recurring transaction's subscription terms, via a new optional `recurringPaymentRequest` field on the value they return. It reuses the same `regularBilling` / `trialBilling` / `billingAgreement` / `managementURL` shape already accepted on the transaction; any field left out falls back to the original transaction's value.

```js
onCouponCodeChange: async (couponCode) => {
  const discounted = await applyCoupon(couponCode);
  return {
    amount: discounted.amount,
    recurringPaymentRequest: {
      regularBilling: { label: "Monthly", amount: discounted.monthlyAmount },
    },
  };
};
```

`recurringPaymentRequest` only applies to recurring transactions — if returned for a one-off payment or a disbursement, it's dropped and a warning is logged, but the rest of the update still applies.
