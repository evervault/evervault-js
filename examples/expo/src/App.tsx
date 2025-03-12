import { EvervaultProvider } from "@evervault/react-native";
import { env } from "./lib/env";
import React from "react";
import { createStaticNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CardExample } from "@/src/screens/Card";
import { ThreeDSecureExample } from "@/src/screens/ThreeDSecure";
import { Image } from "react-native";

const Tabs = createBottomTabNavigator({
  screens: {
    Card: {
      screen: CardExample,
      options: {
        headerShown: false,
        title: "Card",
        tabBarIcon({ color, size }) {
          return (
            <Image
              source={require("@/assets/images/icons/credit-card.png")}
              style={{ width: size, height: size }}
              tintColor={color}
            />
          );
        },
      },
    },

    ThreeDSecure: {
      screen: ThreeDSecureExample,
      options: {
        headerShown: false,
        title: "3DS",
        tabBarIcon({ color, size }) {
          return (
            <Image
              source={require("@/assets/images/icons/fingerprint.png")}
              style={{ width: size, height: size }}
              tintColor={color}
            />
          );
        },
      },
    },
  },
});

const Navigation = createStaticNavigation(Tabs);

export function App() {
  return (
    <EvervaultProvider teamId={env.evTeamId} appId={env.evAppId}>
      <Navigation />
    </EvervaultProvider>
  );
}
