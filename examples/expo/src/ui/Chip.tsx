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

export interface ChipProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPress?(): void;
}

export function Chip({ children, disabled, style, onPress }: ChipProps) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = pressed.value ? 0.95 : 1;
    const opacity = disabled ? 0.5 : pressed.value ? 0.7 : 1;

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
      style={[styles.chip, animatedStyle, style]}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => pressed.set(true)}
      onPressOut={() => pressed.set(false)}
    >
      <Text style={[styles.chipText]}>{children}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingInline: 12,
    paddingBlock: 6,
    borderRadius: 999,
    backgroundColor: "#FBFAFD",
    borderWidth: 1,
    borderColor: "#E9E5F5",
  },
  chipText: {
    color: "#333",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
});
