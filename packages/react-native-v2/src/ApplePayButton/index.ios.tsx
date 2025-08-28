import { View, Text, Pressable } from "react-native";
import { ApplePayButtonProps } from "./types";

export * from "./types";

export function ApplePayButton({ onPress }: ApplePayButtonProps) {
  return (
    <Pressable
      onPress={() => {
        console.log("IOS >>>>>>>>>>>");
        onPress();
        console.log("IOS <<<<<<<<<<");
      }}
    >
      <Text>Apple Pay Button for iOS</Text>
    </Pressable>
  );
}
