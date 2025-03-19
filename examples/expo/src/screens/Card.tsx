import { Card, CardPayload } from "@evervault/react-native";
import { StyleSheet, View, ScrollView, Keyboard, Text } from "react-native";
import React, { useRef, useState } from "react";
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

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      keyboardDismissMode="interactive"
    >
      <View style={styles.container}>
        <Heading>Card</Heading>

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
