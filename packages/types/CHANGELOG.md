# types

## 0.19.0

### Minor Changes

- a128f57: feat: track min-width and min-height of GPay button

## 0.18.0

### Minor Changes

- f7adade: Fix casing of AppConfig.is_sandbox field used for Google Pay

## 0.17.0

### Minor Changes

- c191a58: Add `validation` option to the Card Collection component to allow for customizing validation logic. Currently only supports adding regex validation for the card holder name.
- e50568a: Test sandbox apps in production for Google Pay

## 0.16.0

### Minor Changes

- df76034: Add prepareTransaction method to Apple Pay button config
- 31c1ac8: Expose underlying payment card display name for Apple Pay
- e503d31: Add support for onShippingAddressChange hook for Apple Pay
- 2640be6: Expose last four digits of underlying card number for Google Pay
- 8dec7e4: Add recurring payment support for Apple Pay

## 0.15.0

### Minor Changes

- 311f567: Adds support for requesting billing address information with Google Pay.

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

## 0.14.0

### Minor Changes

- 50727af: Add Rupay support to Card Component

## 0.13.0

### Minor Changes

- 9be6df7: Add support for requesting payer name, email and phone number with Apple Pay

## 0.12.0

### Minor Changes

- 6286f09: Update Apple Pay types

## 0.11.0

### Minor Changes

- d7be3df: Send specific outcome for failOnChallenge

## 0.10.0

### Minor Changes

- bbc7673: feat: Add Apple Pay Disbursements. bugfix: Use domain of parent component, not UI components.

## 0.9.0

### Minor Changes

- f24dcf9: Update apple pay to use the Payment Request API

## 0.8.0

### Minor Changes

- ffb19d1: Replace merchant object with merchantId string field.

  Use the new frontend merchant API to obtain the required details.

## 0.7.0

### Minor Changes

- 446bbcb: Remove merchant.domain field and infer value from window

## 0.6.0

### Minor Changes

- cd40338: - Send merchantOrigin for Google Pay
  - Update iFrame allow value to "payments \*"
  - Update Apple Pay to use domain instead of applePayIdentifier

## 0.5.0

### Minor Changes

- 3847a73: - Adds focus, blur, keyup and keydown events to the Card component to track interactions with inputs inside of the Card component.
  - Updates the payload from the card component to include the parsed month & year even when the entered expiry is invalid. Previously the expiry value would only be returned when the entered value is valid.

## 0.4.0

### Minor Changes

- 82a30c0: Add support for Apple Pay and Google Pay wallets

## 0.3.0

### Minor Changes

- 3156568: Add autoProgress option to Card component to automatically progress to the next input when an input becomes valid.

## 0.2.0

### Minor Changes

- 1df9ba2: Add functionality to disable autoCompletion for fields in the Card component
- e2f0721: Adds 3DS method support

## 0.1.0

### Minor Changes

- 621ca95: Add form rendering to UI components

## 0.0.1

### Patch Changes

- 1ff4434: make internal packages private
