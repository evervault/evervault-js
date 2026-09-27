---
"@evervault/ui-components": minor
---

Render the split expiry a declared card sends as two inputs, `expiry-month` and `expiry-year`, that make up the one `expiry` value. The date is validated across both halves, both are marked invalid when it fails, and the error copy renders under whichever half is declared later; moving from one half into the other while it is still empty does not judge the date yet. Auto-advance and backspace move through the halves in their declared order, `autofocus` can land on either, and the halves fill from the browser's `cc-exp-month` and `cc-exp-year` tokens. Each half takes `label`, `placeholder`, `tooltip`, `autocomplete` and `autofocus` like any field, with defaults under the new `expiryMonth` and `expiryYear` translation keys. A tree declaring a half without the other, or a half alongside the combined field, is refused with an error rather than rendered partially.
