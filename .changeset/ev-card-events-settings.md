---
"@evervault/browser": minor
---

Give `<ev-card>` and its fields what `ui.card()` offers. Each setting sits on the element it is about, as an attribute and a property that always agree:

- The card's `ready`, `error`, `complete`, `swipe`, `validate`, `focus`, `blur`, `keydown` and `keyup` events are dispatched on the element, carrying the same payload as `ui.card()`'s, as `event.detail`. Unlike `change`, they do not bubble: only listeners on the `<ev-card>` itself hear them, so page-wide focus and keyboard handlers never receive them.
- `card.validate()` checks the fields; the result arrives as a `validate` event.
- An attribute is its property's name in lower case, as in HTML: `card.acceptedBrands` is `acceptedbrands`, `cvc.allow3DigitAmex` is `allow3digitamex`. `<ev-card>` is mounted from `teamid` and `appid`.
- On `<ev-card>`, the card-wide settings are `theme`, `colorscheme`, `icons`, `acceptedbrands` (space-separated), `autofocus`, and `autoprogress` and `autocomplete` for every field; `colorscheme` is read once, when the card mounts. Settings that are objects — a theme definition, a brand icon map, `translations`, `customBrands`, `defaultValues`, `validation` and `agentTools` — are properties only. `agentTools` is read when the card mounts.
- The field elements (`<ev-card-holder>`, `<ev-card-number>`, `<ev-card-expiry>`, `<ev-card-expiry-month>`, `<ev-card-expiry-year>`, `<ev-card-cvc>`, `<ev-field>`) are custom elements whose attributes are also properties: `number.autoProgress = true` is `<ev-card-number autoprogress>`. They take `autoprogress` and `errormessage`; `<ev-card-number>` takes `unsupportedbrandmessage`, `<ev-card-cvc>` `redact`, `optional` and `allow3digitamex`, and `<ev-card-holder>` `pattern`, checked against the cardholder name as `<ev-field pattern>` is.
- A field's own setting wins over the card's. The two are never copied into each other.
- Settings changed together reach the card as one update, and a property set before the SDK loads is applied once the element upgrades.
