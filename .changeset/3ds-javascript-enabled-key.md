---
"@evervault/ui-components": patch
---

Send `javascriptEnabled` instead of `javaScriptEnabled` in the 3D Secure browser details. The backend reads `javascriptEnabled`, so before this change it ignored the value and did not send "JavaScript enabled" to the 3DS server.
