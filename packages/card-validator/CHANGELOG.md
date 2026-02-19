# @evervault/card-validator

## 1.5.1

### Patch Changes

- e9ad2b2: Bump qs

## 1.5.0

### Minor Changes

- 3f9e24b: Expose BIN when input length > 5

## 1.4.0

### Minor Changes

- 50727af: Add Rupay support to Card Component

## 1.3.0

### Minor Changes

- 7a15434: Updates card brand configuration to support multiple lengths for CVCs and support 3 character CVCs for Amex cards

## 1.2.0

### Minor Changes

- 3847a73: - Adds focus, blur, keyup and keydown events to the Card component to track interactions with inputs inside of the Card component.
  - Updates the payload from the card component to include the parsed month & year even when the entered expiry is invalid. Previously the expiry value would only be returned when the entered value is valid.

## 1.1.0

### Minor Changes

- 1f6edc4: feat: validate UATP cards

## 1.0.5

### Patch Changes

- 2d22675: validate cvc when no card number is present

## 1.0.4

### Patch Changes

- e7c8697: Version was not released by previou changeset
- e7c8697: Fix React JSX

## 1.0.3

### Patch Changes

- 1ff4434: make internal packages private
- ce4f4c2: fix types dependency
- Updated dependencies [1ff4434]
  - types@0.0.1
