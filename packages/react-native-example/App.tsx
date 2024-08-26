import { StatusBar } from "expo-status-bar";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { registerRootComponent } from "expo";
import {
  type CardPayload,
  EvervaultProvider,
} from "@evervault/evervault-react-native";
import { useState } from "react";
import CardDebug from "./components/CardDebug";
import CardForm from "./components/CardForm";

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    "Missing Evervault environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example."
  );
}

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);

  return (
    <EvervaultProvider
      teamId={process.env.EXPO_PUBLIC_EV_TEAM_UUID}
      appId={process.env.EXPO_PUBLIC_EV_APP_UUID}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>evervault react native</Text>
          <CardDebug cardData={cardData} />
          <CardForm setCardData={setCardData} />
          <Text style={styles.details}>
            {JSON.stringify(cardData, null, 2)}
          </Text>
          <StatusBar style="auto" />
        </ScrollView>
      </SafeAreaView>
    </EvervaultProvider>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  scroll: {
    margin: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    gap: 24,
  },
  input: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  details: {
    marginTop: 24,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospaced",
    }),
  },
});
