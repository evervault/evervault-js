---
"@evervault/ui-components": patch
"@evervault/browser": patch
---

- idempotency guard to prevent `handleOutcome` firing multiple times
- removing the message listener before processing, to prevent duplicate events
- disabling the cancel button after first click to prevent duplicate cancellation calls
