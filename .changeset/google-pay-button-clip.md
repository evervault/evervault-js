---
"@evervault/ui-components": patch
---

Stop cutting off the bottom of the Google Pay button in frames shorter than 41px. Google's button is at least 40px tall, and the frame's 1px top padding pushed its bottom edge out of the frame. Frames 41px and taller are unchanged.
