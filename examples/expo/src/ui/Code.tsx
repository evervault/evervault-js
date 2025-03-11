import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

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
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    width: "100%",
  },
  code: {
    fontFamily: "Menlo",
    fontSize: 12,
    lineHeight: 20,
    width: "100%",
  },
});
