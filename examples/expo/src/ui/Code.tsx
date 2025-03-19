import { PropsWithChildren } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

export interface CodeProps extends PropsWithChildren {
  style?: StyleProp<ViewStyle>;
}

export function Code({ children, style }: CodeProps) {
  return (
    <View style={[styles.pre, style]}>
      <Text style={styles.code}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pre: {
    padding: 14,
    backgroundColor: "#27203B",
    borderRadius: 12,
    width: "100%",
  },
  code: {
    fontFamily: Platform.select({
      ios: "Menlo",
      default: "monospace",
    }),
    fontSize: 12,
    lineHeight: 20,
    width: "100%",
    color: "#fff",
  },
});
