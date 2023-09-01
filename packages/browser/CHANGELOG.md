# @evervault/browser

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
