import { Card, CardPayload } from "@evervault/react-native";
import { StyleSheet, View, ScrollView, Keyboard, Text } from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { Button } from "@/src/ui/Button";
import { Code } from "@/src/ui/Code";
import { Field } from "@/src/ui/Field";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Heading } from "@/src/ui/Heading";

function KeyboardSpacer() {
  const keyboard = useAnimatedKeyboard();
  const tabBarHeight = useBottomTabBarHeight();
  const style = useAnimatedStyle(() => {
    return {
      height: Math.max(keyboard.height.value - tabBarHeight, 0),
    };
  });
  return <Animated.View style={style} />;
}

export function CardExample() {
  const insets = useSafeAreaInsets();

  const cardRef = useRef<Card>(null);
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const [focusedFields, setFocusedFields] = useState<string[]>([]);
  const shouldObfuscate = focusedFields.length === 0;
  const onFocus = useCallback((field: string) => {
    setFocusedFields((prev) => Array.from(new Set([...prev, field])));
  }, []);
  const onBlur = useCallback((field: string) => {
    setFocusedFields((prev) => prev.filter((f) => f !== field));
  }, []);

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      keyboardDismissMode="interactive"
    >
      <View style={styles.container}>
        <Heading>Card</Heading>

        {error && <Text style={styles.error}>{error.message}</Text>}

        <View style={styles.form}>
          <Card
            ref={cardRef}
            validationMode="onBlur"
            autoProgress
            onChange={(p) => setPayload(p)}
            onError={setError}
          >
            <Field label="Cardholder Name" error={payload?.errors?.name}>
              <Card.Holder
                onFocus={() => onFocus("name")}
                onBlur={() => onBlur("name")}
              />
            </Field>

            <Field label="Card Number" error={payload?.errors?.number}>
              <Card.Number
                obfuscateValue={shouldObfuscate}
                onFocus={() => onFocus("number")}
                onBlur={() => onBlur("number")}
              />
            </Field>

            <Card.Row style={styles.row}>
              <Field label="Month" error={payload?.errors?.expiry}>
                <Card.ExpiryMonth
                  onFocus={() => onFocus("expiry")}
                  onBlur={() => onBlur("expiry")}
                />
              </Field>

              <Field label="Year">
                <Card.ExpiryYear
                  onFocus={() => onFocus("expiry")}
                  onBlur={() => onBlur("expiry")}
                />
              </Field>

              <Field label="CVC" error={payload?.errors?.cvc}>
                <Card.Cvc
                  obfuscateValue={shouldObfuscate}
                  onFocus={() => onFocus("cvc")}
                  onBlur={() => onBlur("cvc")}
                />
              </Field>
            </Card.Row>

            <Card.Field
              name="postcode"
              label="Postcode"
              labelStyle={styles.label}
              placeholder="SW1A 1AA"
              autoCapitalize="characters"
              pattern="[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}"
              errorMessage="Enter a UK postcode"
              required
              style={styles.input}
            />
            {payload?.errors?.fields?.postcode && (
              <Text style={styles.error}>{payload.errors.fields.postcode}</Text>
            )}
          </Card>

          <View style={styles.buttons}>
            <Button
              disabled={!payload?.isValid || !payload.isComplete}
              onPress={() => Keyboard.dismiss()}
            >
              Pay
            </Button>

            <Button color="secondary" onPress={() => cardRef.current?.reset()}>
              Reset
            </Button>
          </View>
        </View>

        <Code>{JSON.stringify(payload, null, 2)}</Code>
      </View>

      <KeyboardSpacer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    padding: 16,
    gap: 16,
    flex: 1,
  },

  error: {
    color: "red",
    paddingInline: 16,
  },

  form: {
    gap: 12,
    flex: 1,
    width: "100%",
  },
  row: {
    gap: 12,
  },

  label: {
    fontSize: 12,
    opacity: 0.6,
    marginInline: 2,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9E5F5",
    padding: 12,
    fontSize: 16,
  },

  buttons: {
    gap: 8,
  },
});
