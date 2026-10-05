---
"@evervault/browser": minor
---

Declare the expiry of an `<ev-card>` as two fields, `<ev-card-expiry-month>` and `<ev-card-expiry-year>`, placeable independently of each other, or as the one `<ev-card-expiry>` field as before. The two forms are exclusive within a card: declaring a month without a year, the reverse, or a half alongside the combined field is an error. The card logs it and refuses the tree rather than rendering a partial expiry; a card not yet mounted waits and mounts once the declaration is whole, and a live card keeps the tree it last rendered until then. Declaring other fields between the two halves is allowed but warned about once, since it is rarely meant.
