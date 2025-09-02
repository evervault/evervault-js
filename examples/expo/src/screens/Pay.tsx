import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TextInput,
} from "react-native";
import { ApplePayButton } from "@evervault/react-native";

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

  const handleDidAuthorizePayment = (data: any) => {
    console.log("Payment authorized:", data);
    setIsProcessing(false);

    // Handle the payment response
    // The data contains the encrypted payment token that you can send to your backend
    Alert.alert(
      "Payment Successful",
      "Your payment has been processed successfully!"
    );
  };

  const handleDidFinishWithResult = (data: {
    success: boolean;
    error?: string;
  }) => {
    console.log("Payment finished:", data);
    setIsProcessing(false);

    if (!data.success) {
      Alert.alert(
        "Payment Failed",
        data.error || "An error occurred during payment processing."
      );
    }
  };

  const handlePrepareTransaction = () => {
    console.log("Preparing transaction...");
    // You can modify the transaction here if needed
  };

  const [red, setRed] = useState("0");
  const redNum = useMemo(() => {
    const num = parseInt(red);
    if (isNaN(num)) return 0;
    return num;
  }, [red]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Evervault Apple Pay Example</Text>
      <Text style={styles.subtitle}>iOS Integration</Text>

      <TextInput
        keyboardType="numeric"
        value={red}
        onChangeText={setRed}
        placeholder="Red"
      />

      <View style={styles.paymentContainer}>
        <ApplePayButton
          appId="your-evervault-app-id"
          merchantId="your-apple-merchant-id"
          supportedNetworks={["visa", "masterCard", "amex", "discover"]}
          buttonType="buy"
          buttonStyle="automatic"
          // style={{ width: 100, height: 200 }}
          // onRedChange={(event) => {
          //   console.log("Red changed:", event.nativeEvent.red);
          // }}
          // appId="your-evervault-app-id"
          // merchantId="your-apple-merchant-id"
          // transaction={transaction}
          // buttonType="buy"
          // buttonTheme="automatic"
          // supportedNetworks={["visa", "mastercard", "amex", "discover", "jcb"]}
          // onDidAuthorizePayment={handleDidAuthorizePayment}
          // onDidFinishWithResult={handleDidFinishWithResult}
          // onPrepareTransaction={handlePrepareTransaction}
        />
      </View>

      {isProcessing && (
        <Text style={styles.processingText}>Processing payment...</Text>
      )}

      <Text style={styles.note}>
        Note: This example requires a valid Apple Merchant ID and Evervault App
        ID. Make sure Apple Pay is enabled on your device.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
    marginBottom: 20,
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
