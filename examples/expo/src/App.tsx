import { Card, EvervaultProvider } from "@evervault/react-native";
import { StyleSheet, View } from "react-native";
import { env } from "./lib/env";

export function App() {
  return (
    <EvervaultProvider teamId={env.evTeamId} appId={env.evAppId}>
      <View style={styles.container}>
        <Card>
          <Card.Holder
            placeholder="Cardholder name"
            style={styles.cardHolder}
          />
        </Card>
      </View>
    </EvervaultProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHolder: {
    borderRadius: 8,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E9E5F5",
    padding: 12,
  },
});
