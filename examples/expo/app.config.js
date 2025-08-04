const plugins = [];

if (process.env.PROGUARD_ENABLED === "true") {
  const extraProguardRules = `
    # Rules for Evervault RN SDK
    -keep class com.nativeevervault.** { *; }
    -keep class com.evervault.sdk.** { *; }
    -dontwarn com.nativeevervault.**
    -dontwarn com.evervault.sdk.**

    # Rules for Evervault Android SDK
    -keep class org.bouncycastle.jce.provider.** { *; }
    -keep class org.bouncycastle.** { *; }
    -keep class * extends javax.crypto.** { *; }

    # Rules for React Native Screens
    -dontwarn org.slf4j.impl.StaticLoggerBinder
  `;

  plugins.push([
    "expo-build-properties",
    {
      android: {
        enableProguardInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
        extraProguardRules,
      },
    },
  ]);

  console.log("ProGuard enabled.");
}

module.exports = {
  expo: {
    name: "evervault-expo-example",
    slug: "evervault-expo-example",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "evervault-expo",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.evervault.expo-example",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundImage: "./assets/images/background-icon.png",
      },
      package: "com.evervault.expoexample",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        // Customize build properties here:
        // https://docs.expo.dev/versions/latest/sdk/build-properties/
        'expo-build-properties',
        {
          android: {
            minSdkVersion: 26,
          },
        },
      ],
      ...plugins,
    ],
  },
};
