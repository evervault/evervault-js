import { Text, View } from "react-native";
import { useEvervault } from "./useEvervault";

export function Test() {
  const context = useEvervault();

  return (
    <View>
      <Text>Team ID: {context.teamId}</Text>
      <Text>App ID: {context.appId}</Text>
      <Text>Initialized: {context.initialized ? "Yes" : "No"}</Text>
    </View>
  );
}
