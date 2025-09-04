import { Code } from "@/src/ui/Code";
import { Heading } from "@/src/ui/Heading";
import { ApplePayButton, ApplePayResponse } from "@evervault/react-native";
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function format(value: any) {
  if (value === undefined) {
    return "";
  }

  return JSON.stringify(value, null, 2);
}

export function PayExample() {
  const insets = useSafeAreaInsets();

  const [response, setResponse] = useState<ApplePayResponse | null>(null);

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top }]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="interactive"
    >
      <View style={styles.header}>
        <Heading>Pay</Heading>
      </View>

      <View style={styles.body}>
        <ApplePayButton
          style={styles.applePayButton}
          merchantId="merchant-id"
          supportedNetworks={["visa", "masterCard", "amex", "discover"]}
          appearance="automatic"
          paymentType="book"
          onAuthorizePayment={setResponse}
          onError={console.log}
          onPrepareTransaction={async () => {
            return {
              type: "oneOffPayment",
              country: "US",
              currency: "USD",
              paymentSummaryItems: [
                { label: "Product", amount: "30.00" },
                { label: "Product 2", amount: "0.01" },
                { label: "Total", amount: "30.01" },
              ],
            };
          }}
        />
        <Code style={styles.code}>{format(response)}</Code>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    paddingBlock: 16,
    gap: 16,
    flex: 1,
  },
  header: {
    paddingInline: 16,
  },
  error: {
    color: "red",
    paddingInline: 16,
  },
  body: {
    flex: 1,
    gap: 16,
    paddingInline: 16,
  },

  applePayButton: {
    width: "100%",
    height: 50,
  },

  chipsScroll: {
    flexGrow: 0,
    marginBottom: -6,
  },
  chips: {
    paddingInline: 16,
    flexDirection: "row",
    gap: 4,
  },
  editor: {
    flex: 1,
    padding: 14,
    backgroundColor: "#FBFAFD",
    borderWidth: 1,
    borderColor: "#E9E5F5",
    borderRadius: 12,
    fontFamily: Platform.select({
      ios: "Menlo",
      default: "monospace",
    }),
    fontSize: 12,
    lineHeight: 20,
    width: "100%",
    color: "#000",
  },

  code: {
    flex: 1,
  },
});
