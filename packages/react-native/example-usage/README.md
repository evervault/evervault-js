# Example evervault-react-native app

## Developer Setup
* Copy `.example.env` to `.env` and add an Evervault Team and App UUID.
* Run `npm install` to install dependencies.

* Create a local.properties file in the android folder with the following, updated to your actual sdk path.


```
sdk.dir=/Users/mark/Library/Android/sdk
```
* Install the Android NDK from the Android Studio SDK Manager > SDK Tools. Make sure it matches the version of the ndk in the android/build.gradle file.

#### iOS:
* `cd ios && npx pod-install && cd ..` to install pods.
* `npm run ios` to run the app on iOS simulator.
