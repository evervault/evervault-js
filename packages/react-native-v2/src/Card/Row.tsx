import { StyleSheet, View, ViewProps } from "react-native";
import { CardRowContext } from "../Input";

export type CardRowProps = ViewProps;

export function CardRow({ style, ...props }: CardRowProps) {
  return (
    <CardRowContext.Provider value={true}>
      <View {...props} style={[styles.row, style]} />
    </CardRowContext.Provider>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
});
