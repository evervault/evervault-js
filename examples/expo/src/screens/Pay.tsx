import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TextInput,
  ScrollView,
} from "react-native";
import {
  ApplePayAuthorizedPaymentEvent,
  ApplePayButton,
} from "@evervault/react-native";
import { Code } from "@/src/ui/Code";

export const PayExample: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  // // Transaction details
  // const transaction: Transaction = {
  //   currency: "USD",
  //   country: "US",
  //   paymentSummaryItems: [
  //     {
  //       label: "Premium Subscription",
  //       amount: "29.99",
  //     },
  //   ],
  // };

  const handlePrepareTransaction = () => {
    console.log("Preparing transaction...");
    // You can modify the transaction here if needed
  };

  const [event, setEvent] = useState<ApplePayAuthorizedPaymentEvent | null>(
    null
  );

  return (
    <ScrollView>
      <SafeAreaView>
        <View style={styles.container}>
          <Text style={styles.title}>Evervault Apple Pay Example</Text>
          <Text style={styles.subtitle}>iOS Integration</Text>

          <View style={styles.paymentContainer}>
            <ApplePayButton
              appId="your-evervault-app-id"
              merchantId="your-apple-merchant-id"
              supportedNetworks={[
                "visa",
                "mastercard",
                "amex",
                "discover",
                "jcb",
              ]}
              buttonType="addMoney"
              buttonStyle="automatic"
              onAuthorizePayment={setEvent}
              onFinishWithResult={console.log}
              // transaction={transaction}
              // onPrepareTransaction={handlePrepareTransaction}
              style={{ width: "100%", height: 50 }}
            />
          </View>

          <Code>{event ? JSON.stringify(event, null, 2) : "null"}</Code>

          {isProcessing && (
            <Text style={styles.processingText}>Processing payment...</Text>
          )}

          <Text style={styles.note}>
            Note: This example requires a valid Apple Merchant ID and Evervault
            App ID. Make sure Apple Pay is enabled on your device.
          </Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  paymentContainer: {
    alignItems: "center",
  },
  paymentButton: {
    width: "100%",
    height: 50,
  },
  processingText: {
    textAlign: "center",
    color: "#007AFF",
    marginBottom: 20,
  },
  note: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
});
