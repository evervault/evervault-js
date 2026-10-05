import { Children, isValidElement } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

export type CardRowProps = ViewProps;

// Each child takes an equal share of the row's width.
export function CardRow({ style, children, ...props }: CardRowProps) {
  return (
    <View {...props} style={[styles.row, style]}>
      {Children.toArray(children).map((child, index) => (
        <View
          key={isValidElement(child) ? child.key : index}
          style={styles.cell}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  cell: {
    flex: 1,
  },
});
