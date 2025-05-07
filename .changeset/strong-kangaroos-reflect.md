---
"@evervault/ui-components": minor
"@evervault/browser": minor
"types": minor
---

Adds support for requesting billing address information with Google Pay.

You can now collect billing address information using the `billingAddress` option.

```js
const googlePay = evervault.ui.googlePay(transaction, {
    billingAddress: true,
    process: async () => {
        ...
    }
});
```

You can also specific the address format and request a phone number by using an object instead of a boolean.

```js
const googlePay = evervault.ui.googlePay(transaction, {
    billingAddress: {
        format: 'MIn',
        phoneNumber: true
    },
    process: async () => {
        ...
    }
});
```
