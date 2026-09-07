---
"@evervault/browser": patch
---

Fix `ApplePayButton.availability()` resolving to `"unsupported"` on a second `ui.applePay()` instance. Each instance kept its own SDK load promise and treated an already-present `<script>` tag as loaded, so an instance constructed after another saw the tag its sibling had just appended and probed before Apple's SDK had executed. The load promise is now shared across instances, an existing tag is only treated as ready once the SDK global is actually present, and a non-`"available"` result is no longer memoized so a later call can re-probe.
