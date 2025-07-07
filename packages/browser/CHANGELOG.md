# @evervault/browser

## 2.47.0

### Minor Changes

- 4c34f72: Expose onPaymentMethodChange hook for Apple Pay

## 2.46.0

### Minor Changes

- df76034: Add prepareTransaction method to Apple Pay button config
- 31c1ac8: Expose underlying payment card display name for Apple Pay
- e503d31: Add support for onShippingAddressChange hook for Apple Pay
- cd08b80: Better types for ApplePay onShippingAddressChange
- 8dec7e4: Add recurring payment support for Apple Pay

### Patch Changes

- c4db698: Fix prepareTransaction function for ApplePay
- Updated dependencies [df76034]
- Updated dependencies [31c1ac8]
- Updated dependencies [e503d31]
- Updated dependencies [2640be6]
- Updated dependencies [8dec7e4]
  - types@0.16.0
  - themes@0.1.16

## 2.45.0

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

### Patch Changes

- Updated dependencies [311f567]
  - types@0.15.0
  - themes@0.1.15

## 2.44.1

### Patch Changes

- Updated dependencies [50727af]
  - types@0.14.0
  - themes@0.1.14

## 2.44.0

### Minor Changes

- 6cf0f6f: Adds a new `allow3DigitAmexCVC` option which allows you to configure whether or not 3 digit CVC should be treated as invalid or not. The default value is true.

## 2.43.0

### Minor Changes

- 8bc00d1: - Adds a new `availability` method to the Apple Pay component to check if Apple Pay is available on the current device.
  - Deprecates the old Apple Pay implmentation in favour of the new one which supports third party browsers.

## 2.42.3

### Patch Changes

- d034694: Improve types for apple pay process event

## 2.42.2

### Patch Changes

- 0fa1b24: Handle cases when the Apple Pay script may have already been added to the DOM
- c9da9f5: Add unmount method to Apple Pay component
- d0142c5: Add support for passing integers for size values in new Apple Pay component

## 2.42.1

### Patch Changes

- 99f31d5: Read API URL from client for Apple Pay

## 2.42.0

### Minor Changes

- ff847c2: Apple Pay Beta
  A new `applePayButton` component has been introduced to render the Apple Pay Button inside of
  the main document to allow for third party browser support.

## 2.41.0

### Minor Changes

- 9be6df7: Add support for requesting payer name, email and phone number with Apple Pay

### Patch Changes

- Updated dependencies [9be6df7]
  - types@0.13.0
  - themes@0.1.13

## 2.40.2

### Patch Changes

- Updated dependencies [6286f09]
  - types@0.12.0
  - themes@0.1.12

## 2.40.1

### Patch Changes

- 1e38f67: Change casing on the new outcome possibility - aborted-on-challenge

## 2.40.0

### Minor Changes

- d7be3df: Send specific outcome for failOnChallenge

### Patch Changes

- Updated dependencies [d7be3df]
  - types@0.11.0
  - themes@0.1.11

## 2.39.0

### Minor Changes

- bbc7673: feat: Add Apple Pay Disbursements. bugfix: Use domain of parent component, not UI components.

### Patch Changes

- Updated dependencies [bbc7673]
  - types@0.10.0
  - themes@0.1.10

## 2.38.1

### Patch Changes

- 2987a2a: Validate that URL's provided to SDK are not empty, if they are the default values are used

## 2.38.0

### Minor Changes

- f24dcf9: Update apple pay to use the Payment Request API

### Patch Changes

- Updated dependencies [f24dcf9]
  - types@0.9.0
  - themes@0.1.9

## 2.37.2

### Patch Changes

- Updated dependencies [ffb19d1]
  - types@0.8.0
  - themes@0.1.8

## 2.37.1

### Patch Changes

- Updated dependencies [446bbcb]
  - types@0.7.0
  - themes@0.1.7

## 2.37.0

### Minor Changes

- 4928702: Add redactCVC option to visually redact the CVC value
- cd40338: - Send merchantOrigin for Google Pay
  - Update iFrame allow value to "payments \*"
  - Update Apple Pay to use domain instead of applePayIdentifier

### Patch Changes

- Updated dependencies [cd40338]
  - types@0.6.0
  - themes@0.1.6

## 2.36.0

### Minor Changes

- d859786: Add failOnChallenge option to ThreeDSecure UI Component

## 2.35.0

### Minor Changes

- 3847a73: - Adds focus, blur, keyup and keydown events to the Card component to track interactions with inputs inside of the Card component.
  - Updates the payload from the card component to include the parsed month & year even when the entered expiry is invalid. Previously the expiry value would only be returned when the entered value is valid.

### Patch Changes

- Updated dependencies [3847a73]
  - types@0.5.0
  - themes@0.1.5

## 2.34.0

### Minor Changes

- 82a30c0: Add support for Apple Pay and Google Pay wallets

### Patch Changes

- Updated dependencies [82a30c0]
  - types@0.4.0
  - themes@0.1.4

## 2.33.0

### Minor Changes

- f537d5f: Revert mobile wallet release

## 2.32.0

### Minor Changes

- 57633ec: Add defaultValues option to allow passing a default card holder name to the card component

## 2.31.0

### Minor Changes

- be19a4c: Add support for rendering card icons in the Card component

## 2.30.0

### Minor Changes

- cdfb8fe: Add 'validate' event to card components

## 2.29.0

### Minor Changes

- 8d76d70: Add dependency for handling ASN.1 encoding

## 2.28.0

### Minor Changes

- 3156568: Add autoProgress option to Card component to automatically progress to the next input when an input becomes valid.

### Patch Changes

- Updated dependencies [3156568]
  - types@0.3.0
  - themes@0.1.3

## 2.27.0

### Minor Changes

- 1df9ba2: Add functionality to disable autoCompletion for fields in the Card component
- e2f0721: Adds 3DS method support

### Patch Changes

- Updated dependencies [1df9ba2]
- Updated dependencies [e2f0721]
  - types@0.2.0
  - themes@0.1.2

## 2.26.0

### Minor Changes

- 05eda8e: Adds new ThreeDSecure UI Component for handling 3D Secure authentication

## 2.25.2

### Patch Changes

- 408c73e: remove dead code

## 2.25.1

### Patch Changes

- Updated dependencies [b300278]
  - themes@0.1.1

## 2.25.0

### Minor Changes

- 621ca95: Add form rendering to UI components

### Patch Changes

- Updated dependencies [621ca95]
  - themes@0.1.0
  - types@0.1.0

## 2.24.0

### Minor Changes

- efcd3b0: Remove hubspot form integration code

## 2.23.2

### Patch Changes

- Updated dependencies [1ff4434]
  - themes@0.0.1
  - types@0.0.1

## 2.23.1

### Patch Changes

- 8fe5c04: Removed Data Role Encryption for Files

## 2.23.0

### Minor Changes

- a96e24b: Add acceptedBrands option

## 2.22.1

### Patch Changes

- 43d5607: bugfix: add support for required HTML fields

## 2.22.0

### Minor Changes

- feb39bd: feat: support thirdparty forms for evervault Form encryption

### Patch Changes

- 073560b: fix: specify form uuid for thirdparties

## 2.21.0

### Minor Changes

- 7d527ee: Adding enableFormEncryption to protect forms on websites

## 2.20.0

### Minor Changes

- be782c6: The encrypt function has been enhanced to accept an optional Data Role. This role, once specified, is associated with the data upon encryption. Data Roles can be created in the Evervault Dashboard (Data Roles section) and provide a mechanism for setting clear rules that dictate how and when data, tagged with that role, can be decrypted.

## 2.19.0

### Minor Changes

- 36b1cda: Add async init function to initialize the SDK

## 2.18.0

### Minor Changes

- 352e74b: Adds a new 'fields' option for Card components that can be used to configure which fields should be shown inside of the component. By default the number, expiry and cvc fields will be shown. The available options for fields are 'name', 'number', 'expiry' and 'cvc'

## 2.17.0

### Minor Changes

- df5d317: Adds UI Components

  You can read more about UI Components, and how to upgrade from Inputs here: https://docs.evervault.com/primitives/ui-components

## 2.16.0

### Minor Changes

- 2b86a33: Adds UI Components

  You can read more about UI Components, and how to upgrade from Inputs here: https://docs.evervault.com/primitives/ui-components

## 2.15.1

### Patch Changes

- 84ee172: Fix casting issue in the response of the `decrypt()` function

## 2.15.0

### Minor Changes

- 5a2c188: Patch a bug caused by wrapping the payload in the `decrypt()` function in an object.

## 2.14.2

### Patch Changes

- 5c39813: Add detailed type annotation so SDK to ensure correct types in testing and allow for users to have types when using typescript

## 2.14.1

### Patch Changes

- 4a1ac83: fix error serialization in safari

## 2.14.0

### Minor Changes

- a7df413: feat: added Labels and Custom Styles to Evervault Reveal

## 2.13.0

### Minor Changes

- def1ba2: Add error handling to Reveal. Performance improvement by not loading Evervault SDK on Reveal, as it is not required

## 2.12.0

### Minor Changes

- a1c73da: feat: add more config for Evervault Reveal

### Patch Changes

- 83f693f: fix: fix a bug where browser sdk wouldn't encrypt in debug mode for free teams
- 416915b: fix: fix header serialization

## 2.11.0

### Minor Changes

- 349bd47: improve darkmode support for inputs/reveal

### Patch Changes

- 349bd47: fix inputs auto resizing

## 2.10.0

### Minor Changes

- 02e2ed1: feat: added evervault reveal functionality

### Patch Changes

- 95927f5: fix: remove label from reveal

## 2.9.0

### Minor Changes

- f228f34: Add disableExpiry support to Evervault Inputs. This allows inputs to be rendered with only the card number field.

## 2.8.0

### Minor Changes

- c2a4b11: Added a function to call the Decrypt API using a single-use token

### Patch Changes

- 661eba2: Change auth scheme
- b1f8a95: Update context resolution for browser SDK - compare window origin against inputs url.

## 2.7.2

### Patch Changes

- a5392b2: use Promise.all for encrypting arrays
- 77ea201: move inputs to typescript

## 2.7.1

### Patch Changes

- 2939642: use window.postMessage to send inputs loaded status for better browser compatibility

## 2.7.0

### Minor Changes

- 09bd2c1: add type declarations

### Patch Changes

- 5c22c45: revert fontUrl santitization

## 2.6.1

### Patch Changes

- ff0c619: move crypto module to typescript
- 8fb7c01: Fix sri plugin not returning hashes
- 7716fc4: deprecate forms module
- 5b299d8: clean up tsconfig
- 5b089d0: rename main js to ts only
- dcd8844: actually typechecking and docs for main module
- 4e49d48: format files
- 3a81a8f: change inputs module to typescript
- 456eeaf: move http module to typescript

## 2.6.0

### Minor Changes

- bc3a1f2: added loading status for inputs iframe

### Patch Changes

- 27b299c: missing commit for inputs loading status
- d8d0198: jsdocs for curves
- ab2ea93: move utils to ts
- d110203: rename config to typescript file
- 0f89511: Convert error file to TypeScript and remove unused code
- 0adecdb: Remove unused uuid util

## 2.5.0

### Minor Changes

- 5a22e4c: Update File Encryption to calculate CRC32 checksums for each encrypted file
