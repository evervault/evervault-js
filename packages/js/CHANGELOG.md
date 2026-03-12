# @evervault/js

## 2.10.0

### Minor Changes

- cb24d28: Support setting recurring payment interval unit and count for Apple Pay

## 2.9.1

### Patch Changes

- e9ad2b2: Bump qs

## 2.9.0

### Minor Changes

- 57e945f: - Add colorScheme option for iframe-based UI components
  - Add colorScheme prop to compatible React components

## 2.8.0

### Minor Changes

- aead3ed: expose messageId and messageExpiration fields in Google Pay response

## 2.7.0

### Minor Changes

- 68464e6: feat: support price label in Apple Pay

## 2.6.0

### Minor Changes

- 1e3cd99: Bugfix: GooglePay locale is not passed to the PaymentsClient

## 2.5.0

### Minor Changes

- f7adade: Fix casing of AppConfig.is_sandbox field used for Google Pay

## 2.4.0

### Minor Changes

- e50568a: Test sandbox apps in production for Google Pay

## 2.3.0

### Minor Changes

- 4c34f72: Expose onPaymentMethodChange hook for Apple Pay
- 3f9e24b: Expose BIN when input length > 5

## 2.2.0

### Minor Changes

- df76034: Add prepareTransaction method to Apple Pay button config
- 31c1ac8: Expose underlying payment card display name for Apple Pay
- e503d31: Add support for onShippingAddressChange hook for Apple Pay
- 2640be6: Expose last four digits of underlying card number for Google Pay
- cd08b80: Better types for ApplePay onShippingAddressChange
- 8dec7e4: Add recurring payment support for Apple Pay

## 2.1.0

### Minor Changes

- 00fbd72: Updates types to match the latest release for our Browser SDK

## 2.0.2

### Patch Changes

- d034694: Improve types for apple pay process event

## 2.0.1

### Patch Changes

- 67e08a6: Updates types to match the latest APIs in our browser SDK

## 2.0.0

### Major Changes

- 094b0a3: Add package to load browser SDK and provide types
