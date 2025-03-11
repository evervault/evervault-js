import { Card, CardPayload, EvervaultProvider } from "@evervault/react-native";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { env } from "./lib/env";
import React, { useState } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button } from "@/src/ui/Button";
import { Code } from "@/src/ui/Code";
import { Field } from "@/src/ui/Field";

function Form() {
  const insets = useSafeAreaInsets();

  const [payload, setPayload] = useState<CardPayload | null>(null);

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.fill}>
      <ScrollView
        style={styles.fill}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
        keyboardDismissMode="interactive"
      >
        <View style={styles.container}>
          <View style={styles.form}>
            <Card onChange={setPayload}>
              <Field label="Cardholder Name" error={payload?.errors?.name}>
                <Card.Holder
                  placeholder="Johnny Appleseed"
                  style={[
                    styles.input,
                    payload?.errors?.name && styles.inputError,
                  ]}
                />
              </Field>

              <Field label="Card Number" error={payload?.errors?.number}>
                <Card.Number
                  placeholder="1234 1234 1234 1234"
                  style={[
                    styles.input,
                    payload?.errors?.number && styles.inputError,
                  ]}
                />
              </Field>

              <View style={styles.row}>
                <Field label="Expiration Date" error={payload?.errors?.expiry}>
                  <Card.Expiry
                    placeholder="MM / YY"
                    style={[
                      styles.input,
                      payload?.errors?.expiry && styles.inputError,
                    ]}
                  />
                </Field>

                <Field label="CVC" error={payload?.errors?.cvc}>
                  <Card.Cvc
                    placeholder="CVC"
                    style={[
                      styles.input,
                      payload?.errors?.cvc && styles.inputError,
                    ]}
                  />
                </Field>
              </View>
            </Card>

            <Button disabled={!payload?.isValid || !payload.isComplete}>
              Buy now
            </Button>
          </View>

          <Code>{JSON.stringify(payload, null, 2)}</Code>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function App() {
  return (
    <SafeAreaProvider>
      <EvervaultProvider teamId={env.evTeamId} appId={env.evAppId}>
        <Form />
      </EvervaultProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
    flex: 1,
    alignItems: "center",
  },
  fill: {
    flex: 1,
  },

  form: {
    gap: 12,
    flex: 1,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 12,
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
});
