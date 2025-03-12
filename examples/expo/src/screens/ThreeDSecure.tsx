import { easeOutExpo } from "@/src/lib/animate";
import { env } from "@/src/lib/env";
import { Button } from "@/src/ui/Button";
import { Code } from "@/src/ui/Code";
import { IconButton } from "@/src/ui/IconButton";
import { ThreeDSecure, useThreeDSecure } from "@evervault/react-native";
import { useCallback, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  Keyframe,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

async function create3DSecureSession(): Promise<{ id: string }> {
  const token = btoa(`${env.evAppId}:${env.evApiKey}`);
  const response = await fetch(
    `https://api.evervault.com/payments/3ds-sessions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify({
        card: {
          cvc: "123",
          number: "4242424242424242",
          expiry: {
            month: "01",
            year: "30",
          },
        },
        merchant: {
          name: "Test Merchant",
          website: "https://test-merchant.com",
          categoryCode: "4011",
          country: "ie",
        },
        payment: {
          type: "one-off",
          amount: 1000,
          currency: "eur",
        },
        acquirer: {
          bin: "444444",
          merchantIdentifier: "837223891854392",
          country: "ie",
        },
      }),
    }
  );

  const session = await response.json();

  if (!response.ok) {
    throw new Error(
      `Failed to create 3DS session: ${JSON.stringify(session, undefined, 2)}`
    );
  }

  return session;
}

export function ThreeDSecureExample() {
  const insets = useSafeAreaInsets();

  const tds = useThreeDSecure();
  const [status, setStatus] = useState<"idle" | "success" | "failure">("idle");

  const handlePayment = useCallback(async () => {
    const session = await create3DSecureSession();
    tds.start(session.id, {
      onSuccess: () => setStatus("success"),
      onFailure: () => setStatus("failure"),
      onError: () => setStatus("failure"),
    });
  }, [tds]);

  const cancel = useCallback(() => {
    tds.cancel();
  }, [tds]);

  return (
    <ScrollView
      style={[styles.fill, { paddingTop: insets.top }]}
      keyboardDismissMode="interactive"
    >
      <View style={styles.container}>
        <Button onPress={handlePayment}>Pay</Button>

        <Code>{JSON.stringify({ ...tds, status }, null, 2)}</Code>

        <ThreeDSecure state={tds}>
          <Modal
            visible
            transparent
            accessibilityViewIsModal
            onRequestClose={cancel}
          >
            <Animated.View
              entering={backdropEntering.duration(300)}
              exiting={backdropExiting.duration(300)}
              style={styles.backdrop}
            />

            <Animated.View
              entering={modalEntering.duration(300)}
              exiting={modalExiting.duration(300)}
              style={[styles.modal, { top: insets.top, bottom: insets.bottom }]}
            >
              <IconButton
                source={require("@/assets/images/icons/x.png")}
                onPress={cancel}
                accessibilityLabel="Close"
              />
              <ThreeDSecure.Frame style={styles.frame} />
            </Animated.View>
          </Modal>
        </ThreeDSecure>
      </View>
    </ScrollView>
  );
}

const backdropEntering = FadeIn.easing(easeOutExpo);
const backdropExiting = FadeOut.easing(easeOutExpo);
const modalEntering = new Keyframe({
  from: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
  },
  to: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: easeOutExpo,
  },
});
const modalExiting = new Keyframe({
  from: {
    opacity: 1,
    transform: [{ scale: 1 }],
  },
  to: {
    opacity: 0,
    transform: [{ scale: 0.95 }],
    easing: easeOutExpo,
  },
});

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "white",
  },

  container: {
    padding: 16,
    gap: 20,
    flex: 1,
    alignItems: "center",
  },

  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modal: {
    position: "absolute",
    left: 0,
    right: 0,
    padding: 12,
    gap: 8,
    alignItems: "flex-end",
  },
  frame: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    flex: 1,
    width: "100%",
  },
});
