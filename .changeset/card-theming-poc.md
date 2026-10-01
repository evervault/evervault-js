---
"@evervault/browser": minor
"@evervault/js": minor
"@evervault/react": minor
---

Add semantic theming to the `minimal`, `clean` and `material` presets: pass `primary`, `greyTone`, `roundness`, `font` or `selectors`, for example `clean({ primary: "#16a34a" })` or `clean(myTheme, { primary: "#16a34a" })`. Use `cssVar("--brand-color")`, exported from `@evervault/js`, to take a value from your page's `:root`.
