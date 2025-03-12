import { Card, CardPayload, EvervaultProvider } from "@evervault/react-native";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { env } from "./lib/env";
import React, { useRef, useState } from "react";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Button } from "@/src/ui/Button";
import { Code } from "@/src/ui/Code";
import { Field } from "@/src/ui/Field";

function Form() {
  const insets = useSafeAreaInsets();

  const cardRef = useRef<Card>(null);
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
            <Card ref={cardRef} onChange={setPayload}>
              <Field label="Cardholder Name" error={payload?.errors?.name}>
                <Card.Holder />
              </Field>

              <Field label="Card Number" error={payload?.errors?.number}>
                <Card.Number />
              </Field>

              <View style={styles.row}>
                <Field label="Expiration Date" error={payload?.errors?.expiry}>
                  <Card.Expiry />
                </Field>

                <Field label="CVC" error={payload?.errors?.cvc}>
                  <Card.Cvc />
                </Field>
              </View>
            </Card>

            <View style={styles.buttons}>
              <Button
                disabled={!payload?.isValid || !payload.isComplete}
                onPress={() => Keyboard.dismiss()}
              >
                Pay
              </Button>

              <Button
                color="secondary"
                onPress={() => cardRef.current?.reset()}
              >
                Reset
              </Button>
            </View>
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

  buttons: {
    gap: 8,
  },
});
