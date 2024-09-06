import { StatusBar } from "expo-status-bar";
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { registerRootComponent } from "expo";
import {
  type CardPayload,
  EvervaultProvider,
  ThreeDSecureModal,
  ThreeDSecure,
  useThreeDSecure,
} from "@evervault/evervault-react-native";
import { useState } from "react";
import CardForm from "./components/CardForm";
import { create3DSecureSession, PaymentResult} from "./components/threeDSdemo";
import { UseThreeDSecureResponse } from "@evervault/evervault-react-native/dist/typescript/src/components/3DS/types";

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    "Missing Evervault environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example."
  );
}

function Checkout({ cardData }: { cardData: CardPayload | undefined }) {
  const [paymentStatus, setPaymentStatus] = useState<string>("in-progress");
  const tds: UseThreeDSecureResponse = useThreeDSecure();

  const handlePayment = async () => {
    const sessionId = await create3DSecureSession({
      cardNumber: cardData.card.number,
      expiryMonth: cardData.card.expiry.month,
      expiryYear: cardData.card.expiry.year,
    });

    tds.start(sessionId, {
      onSuccess: () => {
        console.log("3DS successful");
        setPaymentStatus("success");
      },
      onFailure: (error: Error) => {
        console.error("3DS failed", error);
        setPaymentStatus("failed");
      },
      onError: (error: Error) => {
        console.log("3DS errored", error);
        setPaymentStatus("failed");
      },
    });
  };

  return (
    
    <>
      {(paymentStatus === "success") && <PaymentResult status="Successful" />}
      {(paymentStatus === "failed") && <PaymentResult status="Failed" />}
      {(paymentStatus === "in-progress") && (
        <>
        <ThreeDSecureModal state={tds} />
        <Button title="Pay" onPress={handlePayment} />
        </>
      )}
    </>
  );
}

function CustomThreeDSecureCheckout({cardData}: {cardData: CardPayload | undefined}) {
  const [paymentStatus, setPaymentStatus] = useState<string>("in-progress");
  
  const tds = useThreeDSecure();

  const handlePayment = async () => {
    const sessionId = await create3DSecureSession({
      cardNumber: cardData?.card.number,
      expiryMonth: cardData?.card.expiry.month,
      expiryYear: cardData?.card.expiry.year,
    });

    tds.start(sessionId, {
      onSuccess: () => {
        console.log("3DS successful");
        setPaymentStatus("success");
      },
      onFailure: (error: Error) => {
        console.error("3DS failed", error);
        setPaymentStatus("failed");
      },
      onError: (error: Error) => {
        console.log("3DS errored", error);
        setPaymentStatus("failed");
      },
    });
  }

  const closeCustomModal = async () => {
    await tds.cancel();
  };

  return (
    <>
    {paymentStatus === "in-progress" &&<Button title="Complete Payment" onPress={handlePayment} />}
    {paymentStatus === "success" && <PaymentResult status="Successful" />}
    {paymentStatus === "failed" && <PaymentResult status="Failed" />}
    <ThreeDSecure state={tds}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeCustomModal}>
              <Text>CLOSE MODAL</Text>
            </TouchableOpacity>
            </View>
            <ThreeDSecure.Frame />
          </View>
        </View>
    </ThreeDSecure>
    </>

  );
}

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);

  return (
    <EvervaultProvider
      teamId={process.env.EXPO_PUBLIC_EV_TEAM_UUID}
      appId={process.env.EXPO_PUBLIC_EV_APP_UUID}
    >
      <SafeAreaView style={styles.container}>
        <>
          <ScrollView style={styles.scroll}>
            <Text style={styles.title}>evervault react native</Text>
            <CardForm setCardData={setCardData} />
            <StatusBar style="auto" />
            {/* <CustomThreeDSecureCheckout cardData={cardData}/> */}
            <Checkout cardData={cardData}/>
          </ScrollView>
        </>
        </SafeAreaView>
    </EvervaultProvider>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  scroll: {
    margin: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
  },
  card: {
    width: "100%",
    gap: 24,
  },
  input: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    padding: 10, 
  },
  modalContent: {
    width: "100%",
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    
  },
});

