---
"@evervault/browser": minor
---

Configure a declared `<ev-card>` from its own attributes. `theme` names a built-in theme (`clean`, `material` or `minimal`) as an attribute, or takes a theme definition as a property; `clean` is the default. `color-scheme` takes the values `ui.card()` accepts and is read once, when the card mounts. `auto-progress` turns auto-advance on, and only `auto-progress="false"` turns it off. Changing `theme` or `auto-progress` on a live card applies to it.
