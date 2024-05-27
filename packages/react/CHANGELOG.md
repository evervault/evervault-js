# @evervault/react

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
