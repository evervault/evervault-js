# @evervault/react-native

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
