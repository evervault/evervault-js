import { Text, Pressable } from "react-native";
import { ApplePayButtonProps } from "./types";

export * from "./types";

export function ApplePayButton({ onPress }: ApplePayButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Text>Apple Pay Button</Text>
    </Pressable>
  );
}
