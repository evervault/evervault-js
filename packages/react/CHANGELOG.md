# @evervault/react

## 2.23.0

### Minor Changes

- c4a8713: @evervault/react will now load the Evervault SDK via requirejs when define.amd is present
- 57e945f: - Add colorScheme option for iframe-based UI components
  - Add colorScheme prop to compatible React components

## 2.22.0

### Minor Changes

- ae4549b: Add imperative handle for Card ref to allow manually triggering validation

## 2.21.0

### Minor Changes

- c191a58: Add `validation` option to the Card Collection component to allow for customizing validation logic. Currently only supports adding regex validation for the card holder name.

## 2.20.0

### Minor Changes

- 8dec7e4: Add recurring payment support for Apple Pay

## 2.19.0

### Minor Changes

- 1b2014c: Allow retry when Evervault browser SDK fails to load

## 2.18.0

### Minor Changes

- 8957f08: Improvements to error handling

  The `EvervaultProvider` component now accepts an `onLoadError` prop which will be called if the Evervault SDK fails to load.

  The `onError` prop that is passed to the `Card` component will now also be called if the Evervault SDK fails to load and is not available when the component attempts to mount.

## 2.17.0

### Minor Changes

- 6cf0f6f: Adds a new `allow3DigitAmexCVC` option which allows you to configure whether or not 3 digit CVC should be treated as invalid or not. The default value is true.

## 2.16.2

### Patch Changes

- d034694: Improve types for apple pay process event

## 2.16.1

### Patch Changes

- 67e08a6: Updates types to match the latest APIs in our browser SDK

## 2.16.0

### Minor Changes

- 4928702: Add redactCVC option to visually redact the CVC value

## 2.15.0

### Minor Changes

- d859786: Add failOnChallenge option to ThreeDSecure UI Component

## 2.14.0

### Minor Changes

- 3847a73: - Adds focus, blur, keyup and keydown events to the Card component to track interactions with inputs inside of the Card component.
  - Updates the payload from the card component to include the parsed month & year even when the entered expiry is invalid. Previously the expiry value would only be returned when the entered value is valid.

## 2.13.0

### Minor Changes

- a3bd556: Remount 3ds component after error

## 2.12.0

### Minor Changes

- 57633ec: Add defaultValues option to allow passing a default card holder name to the card component

## 2.11.0

### Minor Changes

- be19a4c: Add support for rendering card icons in the Card component

## 2.10.0

### Minor Changes

- 36d9212: Add acceptedBrands prop to react Card component

## 2.9.0

### Minor Changes

- 3156568: Add autoProgress option to Card component to automatically progress to the next input when an input becomes valid.

## 2.8.0

### Minor Changes

- 1df9ba2: Add functionality to disable autoCompletion for fields in the Card component

## 2.7.0

### Minor Changes

- 05eda8e: Adds new ThreeDSecure UI Component for handling 3D Secure authentication

## 2.6.1

### Patch Changes

- 1ff4434: make internal packages private

## 2.6.0

### Minor Changes

- 4b67fc7: Add acceptedBrands option to the Card component

## 2.5.1

### Patch Changes

- 6e836fe: Some UI component options weren't available as React props.

  - Adds autoFocus prop for Card and Pin Component.
  - Adds mode prop for Pin component.
  - Adds inputType prop for Pin component.

## 2.5.0

### Minor Changes

- 352e74b: Adds a new 'fields' option for Card components that can be used to configure which fields should be shown inside of the component. By default the number, expiry and cvc fields will be shown. The available options for fields are 'name', 'number', 'expiry' and 'cvc'

## 2.4.0

### Minor Changes

- 3cb8eca: Adds decrypt function to React SDK

## 2.3.2

### Patch Changes

- 8aef7ed: Improved type definitions

## 2.3.1

### Patch Changes

- 334052a: Remove bundledDependencies from package.json

## 2.3.0

### Minor Changes

- 2b86a33: Adds UI Components

  You can read more about UI Components, and how to upgrade from Inputs here: https://docs.evervault.com/primitives/ui-components

## 2.2.2

### Patch Changes

- 5c39813: Add detailed type annotation so SDK to ensure correct types in testing and allow for users to have types when using typescript

## 2.2.1

### Patch Changes

- 2326ad6: fix: handle undefined custom config

## 2.2.0

### Minor Changes

- def1ba2: Add error handling to Reveal. Performance improvement by not loading Evervault SDK on Reveal, as it is not required

## 2.1.0

### Minor Changes

- a1c73da: feat: add more config for Evervault Reveal

## 2.0.1

### Patch Changes

- 490005b: allow basic request object for compat with NextJS SSR
- f325cb4: fix release flow

## 2.0.0

### Major Changes

- bfa5a56: Add EvervaultReveal
  Migrate React SDK to Typescript
  Bump minimum React version to 18
  Turn on auto-resize Inputs and Reveal by Default
  Fix bug with SSR Inputs

## 3.0.0

### Major Changes

- 349bd47: increase minimum react version to 18

### Minor Changes

- 349bd47: auto-resize inputs iframe when using React

### Patch Changes

- Updated dependencies [349bd47]
- Updated dependencies [349bd47]
  - @evervault/browser@2.11.0

## 2.8.0

### Minor Changes

- 02e2ed1: feat: added evervault reveal functionality

### Patch Changes

- Updated dependencies [95927f5]
- Updated dependencies [02e2ed1]
  - @evervault/browser@2.10.0

## 2.7.0

### Minor Changes

- f228f34: Add disableExpiry support to Evervault Inputs. This allows inputs to be rendered with only the card number field.

### Patch Changes

- Updated dependencies [f228f34]
  - @evervault/browser@2.9.0

## 2.6.0

### Patch Changes

- 4a344ed: add react, licences
- Updated dependencies [661eba2]
- Updated dependencies [b1f8a95]
- Updated dependencies [c2a4b11]
  - @evervault/browser@2.8.0
