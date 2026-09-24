---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
---

Add semantic theming to the `minimal`, `clean` and `material` presets. Each takes an optional config as its second argument, with `primary`, `greyTone`, `roundness` and `font`, plus a `selectors` escape hatch for anything else. The existing theme extension stays the first argument, so calls like `clean(myTheme)` are unaffected. `cssVar(name)` is exported from `@evervault/js` to read a CSS custom property off your own page, and can be used for any value in the config, including inside `selectors`. It resolves on your page at the point it's called, which is what lets the value reach the card's iframe.
