# @evervault/browser

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
