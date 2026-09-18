---
"@evervault/ui-components": minor
---

Derive card auto-advance from the order the fields actually render in, rather than jumping to a fixed field id. With `autoProgress` enabled, completing a field now focuses whichever field comes next in that order, and backspace in an empty field steps back to the previous one. Completing the security code advances too.

Three behaviour changes for existing `autoProgress` integrations:

- **Cards that do not render every field now keep advancing.** Auto-advance used to look for the expiry (and then the security code) by id, so it stopped dead whenever that field was not on the card: `fields: ["number", "cvc"]` or `hiddenFields: "expiry"` left focus sitting in the number field once it was complete. Focus now moves on to the next field that is actually rendered — number to cvc in both of those examples.
- **Backspace in an empty field steps back**, on every card including the default `number, expiry, cvc` order: backspace in an empty security code now moves focus to the expiry, and that keystroke is cancelled so it does not delete a character there.
- **The security code advances once it fills the mask for its brand**, which is the longest length that brand accepts. A brand accepting three or four digits (American Express, and custom brands declaring both) only advances at four, as does a card number that has not yet identified a brand; a valid three digit code stays put, because the next digit may still be coming.

Forward auto-advance on a card rendering the full set of fields in the default order is unchanged.
