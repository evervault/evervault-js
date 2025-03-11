import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

export interface FieldProps extends PropsWithChildren {
  label: string;
  error?: string;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      {children}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 12,
    opacity: 0.6,
  },
  error: {
    color: "#CB1D3E",
    fontSize: 12,
  },
});
