---
"@evervault/ui-components": patch
---

Declare Subresource Integrity hashes for dynamically imported chunks in an import map. Chunks fetched by import() have no tag to carry an integrity attribute, so they previously ran without any hash check.
