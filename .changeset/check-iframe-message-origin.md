---
"@evervault/browser": patch
"@evervault/ui-components": patch
---

Only accept component messages from the expected window and origin on both sides of the iframe, and only accept 3DS results from the component's own 3DS frame. Drop component messages whose payload does not have the expected shape.
