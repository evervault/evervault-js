# types

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
