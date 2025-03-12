import { StyleSheet, Text, TextProps } from "react-native";

export interface HeadingProps extends TextProps {}

export function Heading({ style, ...props }: HeadingProps) {
  return <Text style={[styles.heading, style]} {...props} />;
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
