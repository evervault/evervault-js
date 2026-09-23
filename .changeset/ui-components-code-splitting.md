---
"@evervault/ui-components": patch
---

Code-split each component type behind a dynamic import instead of bundling all eight into one chunk. An iframe now only fetches the code for the component it was asked to render. No public API change.
