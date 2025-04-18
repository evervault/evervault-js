---
"@evervault/browser": minor
---

Check for Apple Pay availability before rendering the Apple Pay button. If Apple Pay is not available, the button will not be rendered and a message will be logged to the browser console. No error is thrown and you may continue to setup event listeners and attempt to call mount again in case Apple Pay becomes available after prompting the user to take action. You can use the new 'availability' method on the Apple Pay component if you need to programatically respond to the availability status.
