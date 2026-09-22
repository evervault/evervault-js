---
"@evervault/browser": minor
---

Add the `<ev-card>` custom element, a card declared in HTML rather than mounted from `ui.card()`. Loading the SDK registers it; the element renders the default card (number above expiry and cvc) in its own closed shadow root and dispatches `change` as a `CustomEvent` whose `detail` is the card payload.

`team-id` and `app-id` on the element mount it as soon as it is connected. Without them, `evervault.ui.mount()` mounts every `<ev-card>` on the page with that client, skipping any that is already live. Removing the element from the DOM destroys the card and releases its listeners; reinserting it mounts a new one.
