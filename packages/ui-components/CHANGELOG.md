# @evervault/ui-components

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
