# evervault-expo-example

This is an example Expo app for Evervault's React Native SDK.

## Prerequisites

You need to install and set up Android Studio and Xcode to compile and run Android and iOS projects on your local machine. See the following on how to set up these tools:

- [Android Studio](https://docs.expo.dev/get-started/set-up-your-environment/?platform=android&device=physical&mode=development-build&buildEnv=local#set-up-an-android-device-with-a-development-build)

- [Xcode](https://docs.expo.dev/get-started/set-up-your-environment/?platform=ios&device=physical&mode=development-build&buildEnv=local#set-up-an-ios-device-with-a-development-build)

## Getting Started

1. Clone the `.env` file into a new `.env.local` file. Add your app credentials.

1. Install dependencies

   ```bash
   pnpm i
   ```

1. Generate development builds for iOS and Android

   ```bash
   pnpm ios
   pnpm android
   ```

   > !NOTE
   > Applications that want to use `@evervault/react-native` cannot use Expo Go because we bundle custom native code.

1. Start the development server

   ```bash
   pnpm dev
   ```
