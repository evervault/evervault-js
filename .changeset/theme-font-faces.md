---
"@evervault/ui-components": minor
"@evervault/browser": minor
"@evervault/react": minor
---

Add a `fontFaces` option to the UI component theme so self-hosted brand fonts can be embedded as base64 data URLs. The iframe CSP only allows stylesheets and font files from Google Fonts, so a font hosted on a customer's own domain could not be loaded through the existing `fonts` option. Faces are validated before injection: the source must be a base64 data URL of type `font/woff2`, `font/woff`, `font/ttf` or `font/otf`, must have distinct, non-empty glyphs for digits 0-9, and invalid faces are dropped with a console error instead of being written into the stylesheet.
