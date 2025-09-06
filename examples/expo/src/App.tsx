import { EvervaultProvider } from "@evervault/react-native";
import { env } from "./lib/env";
import React from "react";
import { createStaticNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CardExample } from "@/src/screens/Card";
import { ThreeDSecureExample } from "@/src/screens/ThreeDSecure";
import { Image, ImageSourcePropType } from "react-native";
import { EncryptExample } from "@/src/screens/Encrypt";
import { PayExample } from "@/src/screens/Pay";

function tabBarIcon(source: ImageSourcePropType) {
  return function TabBarIcon({ color, size }: { color: string; size: number }) {
    return (
      <Image
        source={source}
        style={{ width: size, height: size }}
        tintColor={color}
      />
    );
  };
}

const Tabs = createBottomTabNavigator({
  screens: {
    Card: {
      screen: CardExample,
      options: {
        headerShown: false,
        title: "Card",
        tabBarIcon: tabBarIcon(
          require("@/assets/images/icons/credit-card.png")
        ),
      },
    },

    Pay: {
      screen: PayExample,
      options: {
        headerShown: false,
        title: "Pay",
        tabBarIcon: tabBarIcon(require("@/assets/images/icons/smartphone.png")),
      },
    },

    ThreeDSecure: {
      screen: ThreeDSecureExample,
      options: {
        headerShown: false,
        title: "3DS",
        tabBarIcon: tabBarIcon(
          require("@/assets/images/icons/fingerprint.png")
        ),
      },
    },

    Encrypt: {
      screen: EncryptExample,
      options: {
        headerShown: false,
        title: "Encrypt",
        tabBarIcon: tabBarIcon(require("@/assets/images/icons/lock.png")),
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
