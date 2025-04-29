---
"@evervault/react": minor
---

Improvements to error handling

The `EvervaultProvider` component now accepts an `onLoadError` prop which will be called if the Evervault SDK fails to load.

The `onError` prop that is passed to the `Card` component will now also be called if the Evervault SDK fails to load and is not available when the component attempts to mount.
