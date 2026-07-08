# @evervault/js

## 2.16.0

### Minor Changes

- a10d69c: Surface Apple Pay card enrichment (`funding`, `segment`, `country`, `currency`, `issuer`) and phonetic name fields (`phoneticGivenName`, `phoneticFamilyName`) on `billingContact`/`shippingContact` in the `process()` payload. These fields were already sent by the backend and browser but were not previously exposed on the `EncryptedApplePayData` type.

## 2.15.0

### Minor Changes

- 7c48c0b: Add optional `appleMerchantId` to the Apple Pay web SDK. Defaults to `merchant.com.evervault.{merchantId}` for compatibility with Evervault domain verification.
- c29dcc8: Add optional `merchantCapabilities` on Apple Pay disbursement transactions so merchants can select capabilities per call, matching iOS disbursement configuration.
- 0f302ca: Add `transactionType` to the Apple Pay web `process()` payload (`oneOff`, `recurring`, or `disbursement`) based on the transaction category. `paymentDataType` continues to reflect the Apple token format returned by the credentials API (e.g. `3DSecure`).

## 2.14.0

### Minor Changes

- b454046: Expose `applePay.abort()` to programmatically dismiss an active Apple Pay session. This maps to `PaymentRequest.abort()` under the hood and fires the `cancel` event when the sheet is closed. Useful when a shipping address change requires a different currency and the merchant needs to close and reopen Apple Pay with updated transaction details.

## 2.13.0

### Minor Changes

- 974e08d: Add custom brand support to the browser SDK. The `brands.create(name, options)` method lets you define custom card brands. Pass them via the new `customBrands` option on `CardOptions` and they will be forwarded to the card iframe for validation.

## 2.12.0

### Minor Changes

- 52f1154: Adds `validation.cvc.optional` option to Card configuration

## 2.11.0

### Minor Changes

- 417b58c: Expose `card.paymentMethodType` on the Apple Pay and Google Pay payloads. The value is one of `"credit"`, `"debit"`, `"prepaid"`, or `"store"` and reflects the funding type of the card the user selected in their wallet. For Apple Pay it is sourced from `ApplePayPaymentMethod.type`; for Google Pay from `CardInfo.cardFundingSource`. This helps distinguish the selected funding type more reliably than BIN-derived fields, which can return `credit` for dual-network cards even when the user selected their debit card.

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
