# @evervault/inputs

## 2.15.0

### Minor Changes

- aff5a7f: change how custom styles are applied in Inputs

## 2.14.0

### Minor Changes

- a7df413: feat: added Labels and Custom Styles to Evervault Reveal

### Patch Changes

- Updated dependencies [a7df413]
  - @evervault/browser@2.14.0

## 2.13.0

### Minor Changes

- def1ba2: Add error handling to Reveal. Performance improvement by not loading Evervault SDK on Reveal, as it is not required

### Patch Changes

- Updated dependencies [def1ba2]
  - @evervault/browser@2.13.0

## 2.12.1

### Patch Changes

- d32bd4a: remove color scheme

## 2.12.0

### Minor Changes

- a1c73da: feat: add more config for Evervault Reveal

### Patch Changes

- 416915b: fix: fix header serialization
- Updated dependencies [a1c73da]
- Updated dependencies [83f693f]
- Updated dependencies [416915b]
  - @evervault/browser@2.12.0

## 2.11.0

### Minor Changes

- 349bd47: improve darkmode support for inputs/reveal

### Patch Changes

- faa8124: add normal to color scheme to fix transparency
- Updated dependencies [349bd47]
- Updated dependencies [349bd47]
  - @evervault/browser@2.11.0

## 2.10.0

### Minor Changes

- 02e2ed1: feat: added evervault reveal functionality

### Patch Changes

- 944b803: fix: dont load reveal until fetched
- Updated dependencies [95927f5]
- Updated dependencies [02e2ed1]
  - @evervault/browser@2.10.0

## 2.9.1

### Patch Changes

- 873ef33: Previous change violates existing documentation for Evervault Inputs - config overrides support string values.

## 2.9.0

### Minor Changes

- f228f34: Add disableExpiry support to Evervault Inputs. This allows inputs to be rendered with only the card number field.

### Patch Changes

- 770007f: Correct inputs' parsing of its form overrides. Previously explicitly set defaults (i.e. false for disabling fields) were treated as true due to a bad type check. This issue is now resolved.
- Updated dependencies [f228f34]
  - @evervault/browser@2.9.0

## 2.8.2

### Patch Changes

- 4a344ed: add react, licences
- Updated dependencies [661eba2]
- Updated dependencies [b1f8a95]
- Updated dependencies [c2a4b11]
  - @evervault/browser@2.8.0

## 2.8.1

### Patch Changes

- 28f51da: The form was rendered before customisations were applied to it. This caused a short lag where users were seeing the uncustomised form on some browsers.

## 2.8.0

### Minor Changes

- 3a306c1: Bugfix: Card number BIN will now return 8 characters instead of 6 for any card that is not AMEX

## 2.7.1

### Patch Changes

- 0231977: Use .js extension for PostCSS config
- 77ea201: move inputs to typescript
- Updated dependencies [a5392b2]
- Updated dependencies [77ea201]
  - @evervault/browser@2.7.2

## 2.7.0

### Minor Changes

- 3c916a6: Use primary color for focused input labels in material theme

### Patch Changes

- 5212a8c: properly sanitise fontUrls and bring over queryParams

## 2.6.2

### Patch Changes

- 2939642: use window.postMessage to send inputs loaded status for better browser compatibility
- a1676a8: fixed onload behaviour in firefox
- Updated dependencies [2939642]
  - @evervault/browser@2.7.1

## 2.6.1

### Patch Changes

- 5c22c45: revert fontUrl santitization
- Updated dependencies [09bd2c1]
- Updated dependencies [5c22c45]
  - @evervault/browser@2.7.0

## 2.6.0

### Minor Changes

- ab11378: sanitize fontUrl
- caeeb66: switch to vite, use sri

### Patch Changes

- 8fb7c01: Fix sri plugin not returning hashes
- Updated dependencies [ff0c619]
- Updated dependencies [8fb7c01]
- Updated dependencies [7716fc4]
- Updated dependencies [5b299d8]
- Updated dependencies [5b089d0]
- Updated dependencies [dcd8844]
- Updated dependencies [4e49d48]
- Updated dependencies [3a81a8f]
- Updated dependencies [456eeaf]
  - @evervault/browser@2.6.1

## 2.5.0

### Patch Changes

- 639b29e: add inputs
