# Contributing

## Vendor Swift Package Manager Dependencies

The React Native SDK for iOS vendors Swift Package Manager (SPM) dependencies using the `vendor-spm-dependencies.mjs` script.

This is for two reasons:

- [Cocoapods trunk will be moved to read-only by the end of 2026](https://blog.cocoapods.org/CocoaPods-Specs-Repo/), so we are avoiding using Cocoapods for our iOS SDK.

- React Native and Expo [currently don't have full support for SPM dependencies](https://github.com/react-native-community/discussions-and-proposals/issues/587), so we are unable to use them at the moment.

Until we can use SPM dependencies directly, we are vendoring them to the `ios/vendor` directory.

### Adding a new dependency

To vendor a new dependency:

1. Add the dependency to the `Package.swift` file:

```swift
// Package.swift
dependencies: [
  .package(url: "https://github.com/evervault/evervault-ios", from: "2.1.0"),
]
```

2. Run `swift build` to update the `Package.resolved` file:

```bash
swift build
```

3. Add the dependency and source paths to the `package.json` file:

```json
"swiftDependencies": {
  "evervault-ios": [
    "Sources/EvervaultCore"
  ]
}
```

4. Run the vendor script:

```bash
pnpm vendor:ios
```
