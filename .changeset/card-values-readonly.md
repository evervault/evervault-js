---
"@evervault/browser": minor
---

`card.values` is now read-only and is kept current by the card frame; assigning to it is no longer supported. Cards gain a `destroy()` method that releases every listener the card registered. After `destroy()` a card is inert: mounting, updating, subscribing or validating it logs an error and does nothing. Calling `validate()` again before the frame has answered replaces the earlier request, so one `validate` event fires. Updating the theme replaces the previous definition entirely, including anything it extended.
