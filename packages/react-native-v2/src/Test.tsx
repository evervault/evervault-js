import { Text, View } from "react-native";
import { useEvervault } from "./useEvervault";
import { useEffect, useState } from "react";
import { sdk } from "./sdk";

export interface TestProps {
  value: string;
}

export function Test({ value }: TestProps) {
  const context = useEvervault();

  const [encryptedValue, setEncryptedValue] = useState("");

  useEffect(() => {
    if (!context.ready) return;
    sdk.encrypt(value).then(setEncryptedValue);
  }, [value, context.ready]);

  return (
    <View>
      <Text>Team ID: {context.teamId}</Text>
      <Text>App ID: {context.appId}</Text>
      <Text>Ready: {context.ready ? "Yes" : "No"}</Text>

      <Text>Value: {value}</Text>
      <Text>Encrypted Value: {encryptedValue}</Text>
    </View>
  );
}
