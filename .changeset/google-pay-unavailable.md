---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/ui-components": patch
---

Emit an `unavailable` event from Google Pay when the button isn't shown because Google Pay can't be offered, so a merchant can render a fallback. It fires when `isReadyToPay` returns false or throws, when `existingPaymentMethodRequired` is set but Google reports no `paymentMethodPresent`, when the merchant lookup fails, when pay.js fails to load, or when the transaction is a disbursement.

The iframe stays at the size passed to `mount` (`250px` by `45px` by default), so unmount it before rendering a fallback:

```js
googlePay.on("unavailable", () => {
  googlePay.unmount();
  renderFallback();
});
```

`unavailable` means Google Pay can't be offered to this buyer. `error` covers payment failures and the frame failing to load.
