import { PropsWithChildren } from "react";
import {
  Image,
  ImageSourcePropType,
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

export interface IconButtonProps {
  accessibilityLabel: string;
  source: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  onPress?(): void;
}

export function IconButton({
  accessibilityLabel,
  source,
  disabled,
  style,
  onPress,
}: IconButtonProps) {
  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = pressed.value ? 0.95 : 1;
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
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => pressed.set(true)}
      onPressOut={() => pressed.set(false)}
    >
      <Image source={source} style={styles.icon} tintColor="white" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "black",
    padding: 10,
    borderRadius: "50%",
  },
  icon: {
    width: 18,
    height: 18,
  },
});
