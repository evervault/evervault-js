---
"@evervault/ui-components": patch
---

Take Subresource Integrity hashes from the emitted files rather than from the in-memory bundle. When the build is code split, rollup rewrites a chunk after the html has been generated, so hashes taken before the files are written no longer match what ships and the browser blocks the script.
