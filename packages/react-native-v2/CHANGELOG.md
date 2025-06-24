# @evervault/react-native

## 2.5.0

### Minor Changes

- 18e2bf6: - Support `failOnChallenge` option in `useThreeDSecure()`
  - Support `failOnChallenge` option in `session.start()`
  - Support `onRequestChallenge` callback in `session.start()`

## 2.4.0

### Minor Changes

- 7704fcb: - Adds new `obfuscateValue` prop to Card.Number and Card.Cvc to enable value obfuscation

## 2.3.0

### Minor Changes

- 50727af: Add Rupay support to Card Component

### Patch Changes

- Updated dependencies [50727af]
  - @evervault/card-validator@1.4.0

## 2.2.1

### Patch Changes

- 4c4ea2e: - Fixes acceptedBrands validation for Card component

## 2.2.0

### Minor Changes

- 6128bd5: - Updates Android compile and target SDK version to 35
  - Updates Android minimum SDK version to 24

## 2.1.0

### Minor Changes

- 00966b8: - Add `onError` prop to `Card` component to catch native errors
  - Fixes `validationMode` not being used by child `Card` components

## 2.0.0

### Major Changes

- d8c671a: Introduces an internal rewrite of the React Native SDK. This is a breaking change for existing users.

  - The React Native SDK now supports the New Architecture.

  - Encryption and initialization are now done through the `EvervaultProvider` and `useEvervault` hook.

  - Android now supports encryption of all data types.

  - Better DX for styling and customizing React Native components.
