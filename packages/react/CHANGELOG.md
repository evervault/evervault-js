# @evervault/react

## 2.33.0

### Minor Changes

- 88f5d7c: Declare the fields of a `<Card>` as its children. A `<Card>` with children renders the `<ev-card>` element and its `<ev-card-*>` children, so it follows the same rules as the web card. A `<Card>` without children renders from its props exactly as before.

  - `Card.Holder`, `Card.Number`, `Card.Expiry`, `Card.ExpiryMonth`, `Card.ExpiryYear`, `Card.Cvc` and `Card.Field` render in the order written, and `Card.Row` places the fields inside it side by side.
  - Every card field takes `label`, `placeholder`, `tooltip`, `autoComplete`, `autoFocus`, `autoProgress` and `errorMessage`, which replaces the text of its error.
  - `Card.Number` also takes `iconPosition` and `unsupportedBrandMessage`, which replaces the text for a brand the card does not accept.
  - `Card.Holder` also takes `defaultValue` and `pattern`, a pattern the whole name must match.
  - `Card.Cvc` also takes `redact`, `optional`, which completes the card without a security code, and `allow3DigitAmex={false}`, which refuses a 3-digit American Express one.
  - `Card.Field` collects a value of the app's own, reported encrypted in the payload's `fields` under its `name`. It takes `type`, `defaultValue`, `readOnly`, `inputMode`, `autoCapitalize`, `spellCheck` and `enterKeyHint`, and `required`, `minLength`, `maxLength`, `pattern`, `min`, `max` and `step` validate it.
  - Children changed after the card mounted keep the details already typed, and an unsupported child is dropped with a warning.
  - The card's other props and its events work as before, including `preload` and `show()` on the ref. `colorScheme`, `agentTools` and `preload` are read once, when the card mounts, and changing them later has no effect.
  - Declaring children replaces `fields`. `fields`, `redactCVC`, `allow3DigitAmexCVC` and an `autoComplete` map by field are deprecated in favour of the children and their own props (`<Card.Cvc redact allow3DigitAmex />`, `autoComplete` on each field), but still work: a declared card's fields fall back on them, the expiry halves on the map's `expiry`, and a field's own prop wins.

## 2.32.0

### Minor Changes

- aca478a: Rename `card.reveal()` to `card.show()`, and the `<Card>` ref method `reveal()` to `show()`. They display a card loaded with `preload`. The `reveal` names were released only days ago and are removed.
- 6b9e535: Add semantic theming to the `minimal`, `clean` and `material` presets: pass `primary`, `greyTone`, `roundness`, `font` or `selectors`, for example `clean({ primary: "#16a34a" })` or `clean(myTheme, { primary: "#16a34a" })`. Use `cssVar("--brand-color")`, exported from `@evervault/js`, to take a value from your page's `:root`.

## 2.31.0

### Minor Changes

- c162b53: Add a `preload` prop and `reveal()` ref method to `<Card>`, mirroring `@evervault/browser`'s `card.preload()`/`card.reveal()`. Pass `preload` to boot the card hidden on mount, then call `ref.current.reveal()` to show it.

## 2.30.0

### Minor Changes

- 492dafa: Add opt-in `agentTools` option to the card component that registers white-labeled WebMCP tools inside the card iframe for reading form status, focusing a field, and entering a field value.

## 2.29.0

### Minor Changes

- 3313a7d: Add a `fontFaces` option to the UI component theme so self-hosted brand fonts can be embedded as base64 data URLs. The iframe CSP only allows stylesheets and font files from Google Fonts, so a font hosted on a customer's own domain could not be loaded through the existing `fonts` option. Faces are validated before injection: the source must be a base64 data URL of type `font/woff2`, `font/woff`, `font/ttf` or `font/otf`, must have distinct, non-empty glyphs for digits 0-9, and invalid faces are dropped with a console error instead of being written into the stylesheet.

## 2.28.1

### Patch Changes

- 01fcc7a: Fix duplicate 3DS iframe posts and Evervault client memoization
- 9128fb6: Fixes an issue where it was possible to mount duplicate 3DS challenge iframes

## 2.28.0

### Minor Changes

- ee0d7fc: Added more script load handling tools (ScriptLoadError, loadTimeout)

## 2.27.1

### Patch Changes

- 0d548ae: Enable partial `cardIcons` overrides. `icons` now accepts `Partial<CardIcons>` so callers can override individual card icons without supplying all of them.

## 2.27.0

### Minor Changes

- 2c54653: Rewrite SDK loading strategy for better loading and error handling

## 2.26.0

### Minor Changes

- 8501902: Add `customBrands` prop to the `<Card>` component in the React SDK. Pass an array of `CustomBrand` objects to enable custom card brand validation. `BrandOptions` and `CustomBrand` types are re-exported from `@evervault/react`.

## 2.25.0

### Minor Changes

- 52f1154: Adds `validation.cvc.optional` option to Card configuration

## 2.24.0

### Minor Changes

- 417b58c: Expose `card.paymentMethodType` on the Apple Pay and Google Pay payloads. The value is one of `"credit"`, `"debit"`, `"prepaid"`, or `"store"` and reflects the funding type of the card the user selected in their wallet. For Apple Pay it is sourced from `ApplePayPaymentMethod.type`; for Google Pay from `CardInfo.cardFundingSource`. This helps distinguish the selected funding type more reliably than BIN-derived fields, which can return `credit` for dual-network cards even when the user selected their debit card.

## 2.23.1

### Patch Changes

- e9ad2b2: Bump qs

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
