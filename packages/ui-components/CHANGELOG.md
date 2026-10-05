# @evervault/ui-components

## 1.45.0

### Minor Changes

- d138341: Derive card auto-advance from the order the fields actually render in, rather than jumping to a fixed field id. With `autoProgress` enabled, completing a field now focuses whichever field comes next in that order, and backspace in an empty field steps back to the previous one. Completing the security code advances too.

  Three behaviour changes for existing `autoProgress` integrations:

  - **Cards that do not render every field now keep advancing.** Auto-advance used to look for the expiry (and then the security code) by id, so it stopped dead whenever that field was not on the card: `fields: ["number", "cvc"]` or `hiddenFields: "expiry"` left focus sitting in the number field once it was complete. Focus now moves on to the next field that is actually rendered — number to cvc in both of those examples.
  - **Backspace in an empty field steps back**, on every card including the default `number, expiry, cvc` order: backspace in an empty security code now moves focus to the expiry, and that keystroke is cancelled so it does not delete a character there.
  - **The security code advances once it fills the mask for its brand**, which is the longest length that brand accepts. A brand accepting three or four digits (American Express, and custom brands declaring both) only advances at four, as does a card number that has not yet identified a brand; a valid three digit code stays put, because the next digit may still be coming.

  Forward auto-advance on a card rendering the full set of fields in the default order is unchanged.

- 2f26f25: Validate the customer's own fields like the browser validates an input:

  - `required` rejects an empty field, `pattern` must match the whole value, and `minlength`/`maxlength` bound its length.
  - An `email` or `url` field must hold one. A `number` or `date` field must be within `min`/`max` and on a `step` from `min` (1 by default, `"any"` for none, days for a date); `pattern` and the lengths do not apply to it.
  - A `readonly` field is not validated. A bound, length or pattern that does not parse is ignored, and an invalid pattern is warned about.

  As on the card fields, an error shows once the field is left, follows the value until it clears, and shows on every field when the card is validated. The copy is "This field is required" or "Please enter a valid value", unless the field declares an `errormessage`. An invalid field is reported as `null` with its error under `errors.fields`. The card stays valid, since `isValid` only concerns the card fields, but neither it nor the agent tools report it complete until every field is valid.

  Changing a field's validation rules, or declaring it again with other ones, clears what was typed into it, so a value is only ever judged by the rules it was typed under. The card fields keep their own fixed validation, whatever attributes they declare.

- 2f26f25: Report the customer's own fields in the card payload under `fields`, by name, each value encrypted like the card number so no field can be used to read what is typed into it. An empty field is `null` and a field that leaves the tree is dropped. Typing reports a `change`; seeding a `defaultvalue` does not.
- 2f26f25: Render the `field` nodes of a declared card as the customer's own inputs, in declared order among the card fields, keeping what was typed across patches.

  - The input has the id `field-<name>`; themes can target its field as `[ev-name="field-<name>"]`.
  - Takes `label`, `placeholder`, `tooltip`, `autofocus` and `defaultvalue` like the card fields.
  - Carries `type` (`text`, `email`, `tel`, `url`, `number` or `date`), `inputmode`, `readonly`, `spellcheck`, `enterkeyhint`, `maxlength`, `min`, `max` and `step` onto the input.
  - `autocapitalize` (`characters`, `words`, `sentences` or `on`, `none` or `off`) capitalises what is typed on any keyboard, not only a virtual one, so `autocapitalize="characters"` makes a lowercase postcode match an uppercase `pattern`. Like the browser, it leaves `email` and `url` fields alone.
  - `autocomplete` takes a browser token (`"postal-code"`), turns autofill on bare or with `"true"`, and off with `"off"` or `"false"`.
  - A field without a name, a second field with the same name, and an unsupported `type` (rendered as text) are warned about.
  - Focus, blur and key events name the field as `{ field: "field", name }`.

- d138341: Map the remaining per-field card options onto attributes of the `<ev-card-*>` elements, so a declared card no longer has to reach for the config object to set them:

  - `label` and `placeholder` on any field element replace the translated text for that field.
  - `tooltip` on any field element renders the text beside the label, in an element themes can target as `[ev-tooltip]`.
  - `iconposition` on `<ev-card-number>` is carried onto the field as `ev-icon-position`, for the theme to place the brand icon.
  - `autocomplete` on any field element, spelled the HTML way: `<ev-card-number autocomplete="off">` turns the browser's autofill off for that field.
  - `autofocus` on any field element focuses it when the card renders, and `autofocus="false"` keeps focus away from it. A card declaring `autofocus` settles its own focus, so `config.autoFocus` no longer applies to it; declaring it on more than one field focuses the first of them, and focus never moves once the customer has started on the card.
  - `redact` on `<ev-card-cvc>` masks the security code as it is typed.
  - `optional` on `<ev-card-cvc>` accepts the card with an empty security code.
  - `defaultvalue` on `<ev-card-holder>` fills the cardholder name in. It seeds the field rather than binding it: a changed default applies while the field is untouched, but never replaces a name the customer has typed, and seeding reports no `change` of its own. Hosts that want the name bound to their own state have `card.update({ defaultValues: { name } })`.

  The boolean attributes follow the HTML convention: declaring one is enough to turn it on (`<ev-card-cvc redact>`), and only an explicit `="false"` turns it off. `autocomplete` also accepts `"off"`.

  A declared attribute wins over the same option on the config object for that field. Cards that declare no children, or declare a field without the attribute, keep taking the value from the config exactly as before.

- 3706f1b: Apply the card's settings to each field they name. `autoProgress` and `autoComplete` are read per field, with a field's own `autoprogress` or `autocomplete` winning, an expiry half falling back to `expiry`, and the customer's fields read under `fields`. A customer's field with a `maxlength` auto-progresses once it is full. The card fields read `autoprogress` and `errormessage`, the card number `unsupportedbrandmessage`, the security code `allow3digitamex`, and the cardholder `pattern`. `translations.fields`, `validation.fields` and `defaultValues.fields` fill in each customer's field that does not declare its own.
- 836b52f: Render the split expiry a declared card sends as two inputs, `expiry-month` and `expiry-year`, that make up the one `expiry` value. The date is validated across both halves, both are marked invalid when it fails, and the error copy renders under whichever half is declared later; moving from one half into the other while it is still empty does not judge the date yet. Auto-advance and backspace move through the halves in their declared order, `autofocus` can land on either, and the halves fill from the browser's `cc-exp-month` and `cc-exp-year` tokens. Each half takes `label`, `placeholder`, `tooltip`, `autocomplete` and `autofocus` like any field, with defaults under the new `expiryMonth` and `expiryYear` translation keys. A tree declaring a half without the other, or a half alongside the combined field, is refused with a logged error rather than rendered partially, and the card stays on the last tree it rendered.

### Patch Changes

- Updated dependencies [88f5d7c]
  - @evervault/react@2.33.0

## 1.44.4

### Patch Changes

- Updated dependencies [aca478a]
- Updated dependencies [6b9e535]
  - @evervault/react@2.32.0

## 1.44.3

### Patch Changes

- Updated dependencies [142ad57]
  - @evervault/card-validator@1.8.0
  - shared@1.1.26
  - @evervault/react@2.31.0

## 1.44.2

### Patch Changes

- dbc4a79: Remove the inline importmap and inline component preload script from index.html. Both are blocked by the ui-components CSP, which has no `unsafe-inline` for `script-src`, so neither ran in production. The preload script is now emitted as an external file with its own `integrity` attribute, and it carries the SRI hash for each chunk it preloads so `modulepreload` enforces integrity on code split chunks. Static `modulepreload` links in index.html now get an `integrity` attribute too.
- Updated dependencies [c162b53]
  - @evervault/react@2.31.0

## 1.44.1

### Patch Changes

- b36d62a: Force a fresh release. The @evervault/ui-components@1.44.0 release (from #1058) was cancelled mid-flight when the Playwright Docker image mismatch failed a sibling release job, so it never deployed to production. The Docker image is now fixed (#1061).

## 1.44.0

### Minor Changes

- 492dafa: Add opt-in `agentTools` option to the card component that registers white-labeled WebMCP tools inside the card iframe for reading form status, focusing a field, and entering a field value.

### Patch Changes

- Updated dependencies [492dafa]
  - @evervault/react@2.30.0

## 1.43.3

### Patch Changes

- 746aa0d: Code-split each component type behind a dynamic import instead of bundling all eight into one chunk. An iframe now only fetches the code for the component it was asked to render. No public API change.
- @evervault/react@2.29.0

## 1.43.2

### Patch Changes

- 7c41e05: Declare Subresource Integrity hashes for dynamically imported chunks in an import map. Chunks fetched by import() have no tag to carry an integrity attribute, so they previously ran without any hash check.

## 1.43.1

### Patch Changes

- 5f64955: Take Subresource Integrity hashes from the emitted files rather than from the in-memory bundle. When the build is code split, rollup rewrites a chunk after the html has been generated, so hashes taken before the files are written no longer match what ships and the browser blocks the script.

## 1.43.0

### Minor Changes

- 3313a7d: Add a `fontFaces` option to the UI component theme so self-hosted brand fonts can be embedded as base64 data URLs. The iframe CSP only allows stylesheets and font files from Google Fonts, so a font hosted on a customer's own domain could not be loaded through the existing `fonts` option. Faces are validated before injection: the source must be a base64 data URL of type `font/woff2`, `font/woff`, `font/ttf` or `font/otf`, must have distinct, non-empty glyphs for digits 0-9, and invalid faces are dropped with a console error instead of being written into the stylesheet.

### Patch Changes

- Updated dependencies [3313a7d]
  - @evervault/react@2.29.0

## 1.42.1

### Patch Changes

- 0baeef7: Fix the Google Pay button failing on click with a `DEVELOPER_ERROR` when neither `shippingAddress` nor `shippingOptions` is configured. `onPaymentDataChanged` was registered on the payments client unconditionally, but Google requires a matching `SHIPPING_ADDRESS`/`SHIPPING_OPTION` callback intent whenever it's registered - now it's only registered when shipping is actually requested.
- @evervault/react@2.28.1

## 1.42.0

### Minor Changes

- 92bd94b: Default the Google Pay button corner radius to 12 to match pay.js and the Android SDK, which previously rendered 4 on web and 100 on Android. The fallback now uses `??`, so `borderRadius: 0` gives square corners instead of being treated as unset.

### Patch Changes

- 92bd94b: Omit `billingAddressParameters` from the Google Pay request when `billingAddressRequired` is false. Google ignores the field in that case, so no merchant behaviour changes, and the request now matches what the Android SDK emits.
- @evervault/react@2.28.1

## 1.41.6

### Patch Changes

- f0c20d9: Parallelize the independent `getMerchant`/`getAppSDKConfig` requests in ApplePay's `buildSession` and GooglePay's SDK-load handler (`Promise.all`/concurrent kickoff instead of sequential awaits), removing one round-trip of latency from the critical path.
  - @evervault/react@2.28.1

## 1.41.5

### Patch Changes

- a8657b5: Guard `postMessage`/`BroadcastChannel` message listeners in `EvervaultFrame`, `useMessaging`, and `useBroadcastChannel` against events with `null`/`undefined` `data`, preventing a crash when any other script on the page (browser extension, ad/analytics snippet, etc.) posts a message to the window.
- 01fcc7a: Fix duplicate 3DS iframe posts and Evervault client memoization
- 01fcc7a: Fix 3DS iframe post guards in BrowserFingerprint and ChallengeFrame to key on the full next action (data/creq and url) instead of a single field, so a retry with a new url posts again instead of being silently skipped.
- Updated dependencies [01fcc7a]
- Updated dependencies [9128fb6]
  - @evervault/react@2.28.1

## 1.41.4

### Patch Changes

- Updated dependencies [ee0d7fc]
  - @evervault/react@2.28.0

## 1.41.3

### Patch Changes

- 8ea1295: Adds support for React Native 0.79 and Expo 53 in @evervault/react-native

  - Upgrades React Native (and related deps) to 0.79
  - Upgrades Expo (and related deps) to SDK 53
  - Upgrades React (and related deps) to 19
  - Fixes type errors caused by React 19 update
  - Fixes React Native tests caused by React 19 update

- Updated dependencies [8ea1295]
  - shared@1.1.25
  - @evervault/react@2.27.1

## 1.41.2

### Patch Changes

- 0d548ae: Enable partial `cardIcons` overrides. `icons` now accepts `Partial<CardIcons>` so callers can override individual card icons without supplying all of them.
- Updated dependencies [0d548ae]
  - @evervault/react@2.27.1
  - types@0.23.1
  - @evervault/card-validator@1.7.0
  - shared@1.1.24

## 1.41.1

### Patch Changes

- Updated dependencies [2c54653]
  - @evervault/react@2.27.0

## 1.41.0

### Minor Changes

- 974e08d: Pass customBrands from CardConfig into validateNumber and validateCVC. Custom brands participate in brand detection, BIN icon display, and are always accepted regardless of the acceptedBrands filter.

### Patch Changes

- Updated dependencies [33ba948]
- Updated dependencies [8501902]
  - @evervault/card-validator@1.7.0
  - @evervault/react@2.26.0
  - shared@1.1.23

## 1.40.1

### Patch Changes

- Updated dependencies [52f1154]
  - @evervault/react@2.25.0

## 1.40.0

### Minor Changes

- c37865d: feat: allow optional cvc

### Patch Changes

- c9459f0: - idempotency guard to prevent `handleOutcome` firing multiple times
  - removing the message listener before processing, to prevent duplicate events
  - disabling the cancel button after first click to prevent duplicate cancellation calls
- Updated dependencies [c37865d]
  - types@0.23.0
  - @evervault/card-validator@1.6.0
  - @evervault/react@2.24.0
  - shared@1.1.22

## 1.39.3

### Patch Changes

- Updated dependencies [703d92d]
  - @evervault/card-validator@1.6.0
  - shared@1.1.21

## 1.39.2

### Patch Changes

- Updated dependencies [417b58c]
  - @evervault/react@2.24.0

## 1.39.1

### Patch Changes

- e59ed25: Switch jsonpath to jsonpath-rfc9535 to patch vulnerability

## 1.39.0

### Minor Changes

- 4835dc5: Move color-scheme checks to main bundle

### Patch Changes

- e9ad2b2: Bump qs
- Updated dependencies [e9ad2b2]
  - @evervault/card-validator@1.5.1
  - @evervault/react@2.23.1
  - shared@1.1.20

## 1.38.0

### Minor Changes

- 75802c2: Add emailRequired option to GooglePay to allow collecting email addresses.
- 57e945f: - Add colorScheme option for iframe-based UI components
  - Add colorScheme prop to compatible React components

### Patch Changes

- Updated dependencies [c4a8713]
- Updated dependencies [75802c2]
- Updated dependencies [57e945f]
  - @evervault/react@2.23.0
  - types@0.22.0
  - @evervault/card-validator@1.5.0
  - shared@1.1.19

## 1.37.1

### Patch Changes

- Updated dependencies [aead3ed]
  - types@0.21.0
  - @evervault/card-validator@1.5.0
  - @evervault/react@2.22.0
  - shared@1.1.18

## 1.37.0

### Minor Changes

- 5bd4977: Support custom price labels

### Patch Changes

- Updated dependencies [5bd4977]
  - types@0.20.0
  - @evervault/card-validator@1.5.0
  - @evervault/react@2.22.0
  - shared@1.1.17

## 1.36.0

### Minor Changes

- a128f57: feat: track min-width and min-height of GPay button

### Patch Changes

- Updated dependencies [a128f57]
  - types@0.19.0
  - @evervault/react@2.22.0
  - @evervault/card-validator@1.5.0
  - shared@1.1.16

## 1.35.0

### Minor Changes

- 1e3cd99: Bugfix: GooglePay locale is not passed to the PaymentsClient

## 1.34.2

### Patch Changes

- Updated dependencies [ae4549b]
  - @evervault/react@2.22.0

## 1.34.1

### Patch Changes

- cc087cc: Fixes bug where card validation would initially fail when using payment autofill on Chrome on iOS

## 1.34.0

### Minor Changes

- f7adade: Fix casing of AppConfig.is_sandbox field used for Google Pay

### Patch Changes

- Updated dependencies [f7adade]
  - types@0.18.0
  - @evervault/card-validator@1.5.0
  - @evervault/react@2.21.0
  - shared@1.1.15

## 1.33.0

### Minor Changes

- c191a58: Add `validation` option to the Card Collection component to allow for customizing validation logic. Currently only supports adding regex validation for the card holder name.
- e50568a: Test sandbox apps in production for Google Pay

### Patch Changes

- Updated dependencies [c191a58]
- Updated dependencies [e50568a]
  - @evervault/react@2.21.0
  - types@0.17.0
  - @evervault/card-validator@1.5.0
  - shared@1.1.14

## 1.32.2

### Patch Changes

- Updated dependencies [3f9e24b]
  - @evervault/card-validator@1.5.0
  - @evervault/react@2.20.0
  - shared@1.1.13

## 1.32.1

### Patch Changes

- 2992de7: Prevents double CReq submissions for 3D-Secure flow

## 1.32.0

### Minor Changes

- 2640be6: Expose last four digits of underlying card number for Google Pay
- 8dec7e4: Add recurring payment support for Apple Pay

### Patch Changes

- Updated dependencies [df76034]
- Updated dependencies [31c1ac8]
- Updated dependencies [e503d31]
- Updated dependencies [2640be6]
- Updated dependencies [8dec7e4]
  - types@0.16.0
  - @evervault/react@2.20.0
  - @evervault/card-validator@1.4.0
  - shared@1.1.12

## 1.31.2

### Patch Changes

- Updated dependencies [1b2014c]
  - @evervault/react@2.19.0

## 1.31.1

### Patch Changes

- 3ef3bb6: Set CVC field autoComplete value to cc-csc when auto complete is enabled.

## 1.31.0

### Minor Changes

- 311f567: Adds support for requesting billing address information with Google Pay.

  You can now collect billing address information using the `billingAddress` option.

  ```js
  const googlePay = evervault.ui.googlePay(transaction, {
      billingAddress: true,
      process: async () => {
          ...
      }
  });
  ```

  You can also specific the address format and request a phone number by using an object instead of a boolean.

  ```js
  const googlePay = evervault.ui.googlePay(transaction, {
      billingAddress: {
          format: 'MIn',
          phoneNumber: true
      },
      process: async () => {
          ...
      }
  });
  ```

### Patch Changes

- Updated dependencies [311f567]
  - types@0.15.0
  - @evervault/react@2.18.0
  - @evervault/card-validator@1.4.0
  - shared@1.1.11

## 1.30.1

### Patch Changes

- d2a5c17: Update Google Merchant ID

## 1.30.0

### Minor Changes

- 50727af: Add Rupay support to Card Component

### Patch Changes

- Updated dependencies [8957f08]
- Updated dependencies [50727af]
  - @evervault/react@2.18.0
  - @evervault/card-validator@1.4.0
  - types@0.14.0
  - shared@1.1.10

## 1.29.3

### Patch Changes

- f99c60e: Fixes bug where isComplete could be incorrectly set to true in the validate method response for 3 digit amex CVCs when allow3DigitAmexCVC is false

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
