---
"@evervault/browser": patch
"@evervault/ui-components": patch
---

Parallelize the independent `getMerchant`/`getAppSDKConfig` requests in ApplePay's `buildSession` and GooglePay's SDK-load handler (`Promise.all`/concurrent kickoff instead of sequential awaits), removing one round-trip of latency from the critical path.
