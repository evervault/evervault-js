---
"@evervault/browser": minor
---

Render `<ev-card>` from the children it declares. `<ev-card-holder>`, `<ev-card-number>`, `<ev-card-expiry>` and `<ev-card-cvc>` declare the fields in the order written, and `<ev-row>` places the fields inside it side by side. Declaring nothing keeps the default card; declaring anything replaces it. An unsupported child is dropped with a warning naming it.

Children added, removed, reordered or given new attributes after the card mounted are followed, with only the difference sent to the frame so the details already typed stay put. The tree the card currently holds is readable as `card.spec`.
