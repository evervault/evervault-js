import { EvervaultProvider, Test } from "@evervault/react-native";
import { StyleSheet, View } from "react-native";
import { env } from "./lib/env";

export function App() {
  return (
    <EvervaultProvider teamId={env.evTeamId} appId={env.evAppId}>
      <View style={styles.container}>
        <Test value="Hello, world!" />
      </View>
    </EvervaultProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
