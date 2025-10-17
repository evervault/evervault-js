const buildProperties = {
  android: {
    minSdkVersion: 26,
  },
  ios: {},
};

// Use local EvervaultPayment pod
if (process.env.EV_PAY_PATH) {
  buildProperties.ios.extraPods = [
    {
      name: "EvervaultPayment",
      path: process.env.EV_PAY_PATH,
    },
  ];
}

// Enable ProGuard
if (process.env.PROGUARD_ENABLED === "true") {
  buildProperties.android.enableProguardInReleaseBuilds = true;
  buildProperties.android.enableShrinkResourcesInReleaseBuilds = true;

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
  buildProperties.android.extraProguardRules = extraProguardRules;

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
      // Customize build properties here:
      // https://docs.expo.dev/versions/latest/sdk/build-properties/
      ["expo-build-properties", buildProperties],
    ],
  },
};
