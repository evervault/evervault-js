import { Slot } from "@/src/lib/Slot";
import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface FieldProps extends PropsWithChildren {
  label: string;
  error?: string;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <Slot style={[styles.input, error && styles.inputError]}>{children}</Slot>

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
    marginInline: 2,
  },

  input: {
    borderRadius: 12,
    width: "100%",
    borderWidth: 1,
    borderColor: "#E9E5F5",
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    backgroundColor: "#FEF5F6",
    borderColor: "#FBE2E6",
    color: "#CB1D3E",
  },

  error: {
    color: "#CB1D3E",
    fontSize: 12,
    marginInline: 2,
  },
});
