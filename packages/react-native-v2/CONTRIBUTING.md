# Contributing

## Local Android SDK

If you need to test changes to the Android SDK, you can build it locally and use it in your project.

1. Clone the Android SDK repository and make any local changes you need.

```bash
git clone https://github.com/evervault/evervault-android.git
cd evervault-android
```

2. Update the Android SDK's `version.properties` file to include a `-local` suffix.

```diff
-VERSION_NAME=2.4.0
+VERSION_NAME=2.4.0-local
```

3. Build the SDK and publish it to your local Maven repository:

```bash
./gradlew :evervault-core:publishToMavenLocal
```

4. Add the local Maven repository to `packages/react-native-v2/android/build.gradle` file:

```diff
 repositories {
+  mavenLocal()
 }

 dependencies {
-  implementation 'com.evervault.sdk:evervault-core:2.4.0'
+  implementation 'com.evervault.sdk:evervault-core:2.4.0-local'
 }
```

5. Run the local Android build with the `LOCAL_ANDROID_SDK=true` environment variable set.

```gradle
LOCAL_ANDROID_SDK=true pnpm android
```
