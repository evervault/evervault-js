---
"@evervault/browser": patch
---

Fix Apple Pay `availability()` permanently returning `"unsupported"` on every `ApplePayButton` after the first one on a page. The SDK script load is now shared across instances, so a later instance waits for Apple's script to execute instead of treating the first instance's `<script>` tag as already loaded, and a resolved `"unsupported"` is no longer memoized so a subsequent call re-probes. Affects pages that construct more than one button (an express-checkout button alongside the main one) on browsers where `ApplePaySession` is defined by Apple's injected SDK rather than natively — Chrome and Edge on macOS/iOS, in-app browsers, and older Safari.
