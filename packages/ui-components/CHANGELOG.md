# @evervault/ui-components

## 1.29.2

### Patch Changes

- edd5483: Set isComplete to false for 3 digit Amex CVCs when disabled

## 1.29.1

### Patch Changes

- f878e4d: Fixes allow3DigitAmexCVC option

## 1.29.0

### Minor Changes

- 6cf0f6f: Adds a new `allow3DigitAmexCVC` option which allows you to configure whether or not 3 digit CVC should be treated as invalid or not. The default value is true.
- 897b7f7: Extend 3ds method timeout

### Patch Changes

- Updated dependencies [6cf0f6f]
  - @evervault/react@2.17.0

## 1.28.2

### Patch Changes

- Updated dependencies [d034694]
  - @evervault/react@2.16.2

## 1.28.1

### Patch Changes

- Updated dependencies [67e08a6]
  - @evervault/react@2.16.1

## 1.28.0

### Minor Changes

- 9be6df7: Add support for requesting payer name, email and phone number with Apple Pay

### Patch Changes

- Updated dependencies [9be6df7]
  - types@0.13.0
  - @evervault/react@2.16.0
  - @evervault/card-validator@1.3.0
  - shared@1.1.9

## 1.27.3

### Patch Changes

- Updated dependencies [7a15434]
- Updated dependencies [6286f09]
  - @evervault/card-validator@1.3.0
  - types@0.12.0
  - shared@1.1.8
  - @evervault/react@2.16.0

## 1.27.2

### Patch Changes

- Updated dependencies [c967317]
  - shared@1.1.7

## 1.27.1

### Patch Changes

- c7328ab: Fix potential race condition during browser fingerprinting

## 1.27.0

### Minor Changes

- d7be3df: Send specific outcome for failOnChallenge

### Patch Changes

- Updated dependencies [d7be3df]
  - types@0.11.0
  - @evervault/react@2.16.0
  - @evervault/card-validator@1.2.0
  - shared@1.1.6

## 1.26.0

### Minor Changes

- bbc7673: feat: Add Apple Pay Disbursements. bugfix: Use domain of parent component, not UI components.

### Patch Changes

- Updated dependencies [bbc7673]
  - types@0.10.0
  - @evervault/react@2.16.0
  - @evervault/card-validator@1.2.0
  - shared@1.1.5

## 1.25.0

### Minor Changes

- c7976c8: Bump the version of the browser SDK used

### Patch Changes

- @evervault/react@2.16.0

## 1.24.1

### Patch Changes

- b8c2bad: Update IMask to latest version

## 1.24.0

### Minor Changes

- f24dcf9: Update apple pay to use the Payment Request API

### Patch Changes

- Updated dependencies [f24dcf9]
  - types@0.9.0
  - @evervault/react@2.16.0
  - @evervault/card-validator@1.2.0
  - shared@1.1.4

## 1.23.0

### Minor Changes

- ffb19d1: Replace merchant object with merchantId string field.

  Use the new frontend merchant API to obtain the required details.

### Patch Changes

- Updated dependencies [ffb19d1]
  - types@0.8.0
  - @evervault/card-validator@1.2.0
  - @evervault/react@2.16.0
  - shared@1.1.3

## 1.22.0

### Minor Changes

- 446bbcb: Remove merchant.domain field and infer value from window

### Patch Changes

- Updated dependencies [446bbcb]
  - types@0.7.0
  - @evervault/card-validator@1.2.0
  - @evervault/react@2.16.0
  - shared@1.1.2

## 1.21.0

### Minor Changes

- 4928702: Add redactCVC option to visually redact the CVC value
- cd40338: - Send merchantOrigin for Google Pay
  - Update iFrame allow value to "payments \*"
  - Update Apple Pay to use domain instead of applePayIdentifier

### Patch Changes

- Updated dependencies [4928702]
- Updated dependencies [cd40338]
  - @evervault/react@2.16.0
  - types@0.6.0
  - @evervault/card-validator@1.2.0
  - shared@1.1.1

## 1.20.0

### Minor Changes

- d859786: Add failOnChallenge option to ThreeDSecure UI Component

### Patch Changes

- Updated dependencies [d859786]
  - @evervault/react@2.15.0

## 1.19.0

### Minor Changes

- 3847a73: - Adds focus, blur, keyup and keydown events to the Card component to track interactions with inputs inside of the Card component.
  - Updates the payload from the card component to include the parsed month & year even when the entered expiry is invalid. Previously the expiry value would only be returned when the entered value is valid.

### Patch Changes

- Updated dependencies [3847a73]
  - @evervault/card-validator@1.2.0
  - shared@1.1.0
  - @evervault/react@2.14.0
  - types@0.5.0

## 1.18.0

### Minor Changes

- 3baa9d4: Bugfix: Update method URL form field name

## 1.17.0

### Minor Changes

- 82a30c0: Add support for Apple Pay and Google Pay wallets

### Patch Changes

- Updated dependencies [82a30c0]
  - types@0.4.0
  - @evervault/react@2.13.0
  - @evervault/card-validator@1.1.0
  - shared@1.0.9

## 1.16.1

### Patch Changes

- Updated dependencies [a3bd556]
  - @evervault/react@2.13.0

## 1.16.0

### Minor Changes

- 72d682c: autoProgress will now progress when the input mask is complete instead of when the input value becomes valid.

## 1.15.0

### Minor Changes

- 57633ec: Add defaultValues option to allow passing a default card holder name to the card component

### Patch Changes

- Updated dependencies [57633ec]
  - @evervault/react@2.12.0

## 1.14.0

### Minor Changes

- be19a4c: Add support for rendering card icons in the Card component

### Patch Changes

- Updated dependencies [be19a4c]
  - @evervault/react@2.11.0

## 1.13.2

### Patch Changes

- Updated dependencies [36d9212]
  - @evervault/react@2.10.0

## 1.13.1

### Patch Changes

- 184841e: Update form validation to support cvcs being invalidated by a change in card number.
- Updated dependencies [184841e]
  - shared@1.0.8

## 1.13.0

### Minor Changes

- 5feb51c: - Invalid card fields will now be revalidated on any field change. This fixes a bug when a CVC could become invalid after changing to a card number that requires a different CVC length.
  - The CVC value will now be truncated when the card number changes to a card that requires a shorter CVC length.

### Patch Changes

- dc9695a: Force card cvc and expiry fields to be numeric inputs

## 1.12.1

### Patch Changes

- Updated dependencies [1f6edc4]
  - @evervault/card-validator@1.1.0
  - shared@1.0.7

## 1.12.0

### Minor Changes

- 2eb3bf3: Automatically pad expiry month when a user enters a number betwen 2-9

## 1.11.0

### Minor Changes

- cdfb8fe: Add 'validate' event to card components

### Patch Changes

- @evervault/react@2.9.0

## 1.10.0

### Minor Changes

- 3156568: Add autoProgress option to Card component to automatically progress to the next input when an input becomes valid.

### Patch Changes

- Updated dependencies [3156568]
  - @evervault/react@2.9.0
  - types@0.3.0
  - @evervault/card-validator@1.0.5
  - shared@1.0.6

## 1.9.0

### Minor Changes

- 1df9ba2: Add functionality to disable autoCompletion for fields in the Card component
- e2f0721: Adds 3DS method support

### Patch Changes

- Updated dependencies [1df9ba2]
- Updated dependencies [e2f0721]
  - @evervault/react@2.8.0
  - types@0.2.0
  - @evervault/card-validator@1.0.5
  - shared@1.0.5

## 1.8.1

### Patch Changes

- a23d2f5: Add content type header to request to fetch 3DS session

## 1.8.0

### Minor Changes

- 05eda8e: Adds new ThreeDSecure UI Component for handling 3D Secure authentication

### Patch Changes

- Updated dependencies [05eda8e]
  - @evervault/react@2.7.0

## 1.7.4

### Patch Changes

- Updated dependencies [2d22675]
  - @evervault/card-validator@1.0.5
  - shared@1.0.4

## 1.7.3

### Patch Changes

- 9dba8c9: fix: Add name to select

## 1.7.2

### Patch Changes

- 5f1a5f2: fix: add state to select component

## 1.7.1

### Patch Changes

- 9501860: remove spacing from asterisk
  - @evervault/react@2.6.1

## 1.7.0

### Minor Changes

- b300278: Set placeholder on the inputs fix textarea styling

### Patch Changes

- @evervault/react@2.6.1

## 1.6.0

### Minor Changes

- e5a9f94: Add us states select

### Patch Changes

- 2fc8ccb: Add class to field names

## 1.5.0

### Minor Changes

- 46e1765: Add validation to ui components forms

## 1.4.1

### Patch Changes

- Updated dependencies [e7c8697]
- Updated dependencies [e7c8697]
  - @evervault/card-validator@1.0.4
  - shared@1.0.3

## 1.4.0

### Minor Changes

- 621ca95: Add form rendering to UI components

### Patch Changes

- Updated dependencies [621ca95]
  - types@0.1.0
  - @evervault/react@2.6.1
  - @evervault/card-validator@1.0.3
  - shared@1.0.2

## 1.3.1

### Patch Changes

- Updated dependencies [1ff4434]
- Updated dependencies [ce4f4c2]
  - shared@1.0.1
  - types@0.0.1
  - @evervault/card-validator@1.0.3
  - @evervault/react@2.6.1

## 1.3.0

### Minor Changes

- e694b3b: Add ability to restrict accepted brands

### Patch Changes

- e694b3b: Return 6-digit bin when card length is < 16 digits
- Updated dependencies [4b67fc7]
  - @evervault/react@2.6.0

## 1.2.0

### Minor Changes

- f7f1f1e: Improve card number input formatting

## 1.1.3

### Patch Changes

- da7f48c: Fix bug that caused the onchange event to not be fired when inputs were being cleared.
  - @evervault/react@2.5.1

## 1.1.2

### Patch Changes

- fcab244: Fix incorrect attribute values for card holder input
- 9bb29c7: Prevent race condition when setting form values

## 1.1.1

### Patch Changes

- Updated dependencies [6e836fe]
  - @evervault/react@2.5.1

## 1.1.0

### Minor Changes

- 352e74b: Adds a new 'fields' option for Card components that can be used to configure which fields should be shown inside of the component. By default the number, expiry and cvc fields will be shown. The available options for fields are 'name', 'number', 'expiry' and 'cvc'

### Patch Changes

- Updated dependencies [352e74b]
  - @evervault/react@2.5.0

## 1.0.4

### Patch Changes

- Updated dependencies [3cb8eca]
  - @evervault/react@2.4.0

## 1.0.3

### Patch Changes

- Updated dependencies [8aef7ed]
  - @evervault/react@2.3.2

## 1.0.2

### Patch Changes

- Updated dependencies [334052a]
  - @evervault/react@2.3.1

## 1.0.1

### Patch Changes

- 2b86a33: Adds UI Components

  You can read more about UI Components, and how to upgrade from Inputs here: https://docs.evervault.com/primitives/ui-components

- Updated dependencies [2b86a33]
  - @evervault/react@2.3.0

## 1.0.0

### Major Changes

- 0947d8f: Adds the UI Comopnents package
