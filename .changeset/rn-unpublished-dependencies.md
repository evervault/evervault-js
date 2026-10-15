---
"@evervault/react-native": patch
---

Fix installing the package. 2.7.0 to 2.8.0 listed packages that are only used to build and test the SDK as dependencies: `shared` and `types`, which are not published to npm, and `test-renderer`, which requires React 19. They are now dev dependencies.
