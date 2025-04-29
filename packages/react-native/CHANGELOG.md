# @evervault/evervault-react-native

## 1.4.0

### Minor Changes

- 50727af: Add Rupay support to Card Component

### Patch Changes

- Updated dependencies [50727af]
  - @evervault/card-validator@1.4.0

## 1.3.6

### Patch Changes

- Updated dependencies [7a15434]
  - @evervault/card-validator@1.3.0

## 1.3.5

### Patch Changes

- 46291b7: Fix bug where the wrong field was being removed from a set

## 1.3.4

### Patch Changes

- Updated dependencies [3847a73]
  - @evervault/card-validator@1.2.0

## 1.3.3

### Patch Changes

- bd16f3c: Fix issue where CVC length would be truncated to 3 chars when card number has not been entered

## 1.3.2

### Patch Changes

- 184841e: Update form validation to support cvcs being invalidated by a change in card number.

## 1.3.1

### Patch Changes

- aa072b4: Support partial objects for initial values to better reflect card component's pattern.

## 1.3.0

### Minor Changes

- abbe9ad: - Currently if a user enters an amex card and only enters 3 digits in the CVC it is correctly marked as invalid, however, if the user then switches to a Visa card, the CVC is still marked as invalid even though a 3 digit CVC should be considered valid.
  - If a user enters an amex card and a 4 digit CVC of '1234' and then switches to a Visa card the CVC mask is updated and it is truncated to '123', however, the underlying value for the CVC will still be '1234' when it should b changed to '123'.

## 1.2.2

### Patch Changes

- 6842448: Correct onChange behaviour to account for unmounted card number.

## 1.2.1

### Patch Changes

- 684b9ae: Update 3DS challenge URL

## 1.2.0

### Minor Changes

- 0bfe097: Added 3DS support.

  - Added the `<ThreeDSecure />` provider component which allows the use of the and `<ThreeDSecure.Frame />` component which can be used for completing a 3DS Session.
  - One new hook is available, `useThreeDSecure()`, which must be used in conjunction with the 3DS component.

## 1.1.1

### Patch Changes

- Updated dependencies [1f6edc4]
  - @evervault/card-validator@1.1.0

## 1.1.0

### Minor Changes

- 785ae73: Added a new `EvervaultProvider` component to ease initialization of the SDK

## 1.0.1

### Patch Changes

- 1a4bf4b: Added missing on blur prop

## 1.0.0

### Major Changes

- daeeac0: \* Add the ablity to pass (almost) any `TextInputProps` onto various CHD text input components
  - Remove redudant `disabled field`. This behaviour can now be replicated as you wish with full control over the `TextInput` component.

## 0.5.3

### Patch Changes

- e7d1bde: Strip spaces from card number before encryption

## 0.5.2

### Patch Changes

- 30c7f68: Fix cc-name completion on android

## 0.5.1

### Patch Changes

- Updated dependencies [2d22675]
  - @evervault/card-validator@1.0.5

## 0.5.0

### Minor Changes

- 2070874: Fixed android builds on old react native versions

## 0.4.6

### Patch Changes

- 4fda229: Resolve vulnerabilities

## 0.4.5

### Patch Changes

- 171360f: Remove the onComplete method

## 0.4.4

### Patch Changes

- e7c8697: Fix React JSX
- Updated dependencies [e7c8697]
- Updated dependencies [e7c8697]
  - @evervault/card-validator@1.0.4

## 0.4.3

### Patch Changes

- 2a2bb2f: Move card validator to direct deps
  - @evervault/card-validator@1.0.3

## 0.4.2

### Patch Changes

- f957619: Expiry field was being incorrectly marked as invalid

## 0.4.1

### Patch Changes

- 10c2ab4: include in build

## 0.4.0

### Minor Changes

- ae21b79: Add card components
