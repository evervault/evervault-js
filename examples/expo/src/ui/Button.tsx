import { PropsWithChildren } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({ children, disabled, style }: ButtonProps) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = pressed.value ? 0.99 : 1;
    const opacity = disabled ? 0.5 : pressed.value ? 0.9 : 1;

    return {
      transform: [
        {
          scale: withTiming(scale, {
            duration: 300,
            easing: Easing.out(Easing.exp),
          }),
        },
      ],
      opacity: withTiming(opacity, {
        duration: 300,
        easing: Easing.out(Easing.exp),
      }),
    };
  });

  return (
    <AnimatedPressable
      style={[styles.button, animatedStyle, style]}
      disabled={disabled}
      onPressIn={() => pressed.set(true)}
      onPressOut={() => pressed.set(false)}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#63e",
    padding: 14,
    borderRadius: 12,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
