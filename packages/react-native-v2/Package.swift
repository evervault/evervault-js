// swift-tools-version: 5.6
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "react-native-v2",
    dependencies: [
        .package(
            url: "https://github.com/evervault/evervault-ios",
            from: "2.1.0",
        ),
    ]
)
