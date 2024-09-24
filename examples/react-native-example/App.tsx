import { StatusBar } from "expo-status-bar";
import {
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Alert,
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
import {
  create3DSecureSession,
  PaymentResult,
  closeCustomModalWithAlert,
} from "./components/threeDSdemo";

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
  const tds = useThreeDSecure();

  const handlePayment = async () => {
    const sessionId = await create3DSecureSession({
      cardNumber: cardData.card.number,
      expiryMonth: cardData.card.expiry.month,
      expiryYear: cardData.card.expiry.year,
    });

    if (sessionId == null) {
      return;
    }

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
      {paymentStatus === "success" && <PaymentResult status="Successful" />}
      {paymentStatus === "failed" && <PaymentResult status="Failed" />}
      {paymentStatus === "in-progress" && (
        <>
          <ThreeDSecure state={tds}>
            <ThreeDSecure.Frame />
          </ThreeDSecure>
          <Button
            title="Pay"
            onPress={handlePayment}
            disabled={!(cardData?.isComplete && cardData?.isValid)}
          />
        </>
      )}
    </>
  );
}

function CustomThreeDSecureCheckout({
  cardData,
}: {
  cardData: CardPayload | undefined;
}) {
  const [paymentStatus, setPaymentStatus] = useState<string>("in-progress");

  const tds = useThreeDSecure();

  const handlePayment = async () => {
    const sessionId = await create3DSecureSession({
      cardNumber: cardData?.card.number,
      expiryMonth: cardData?.card.expiry.month,
      expiryYear: cardData?.card.expiry.year,
    });

    if (sessionId == null) {
      return;
    }

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

  const closeCustomModal = async () => {
    closeCustomModalWithAlert({ cancel: tds.cancel });
  };

  return (
    <>
      {paymentStatus === "in-progress" && (
        <Button title="Complete Custom Payment" onPress={handlePayment} />
      )}
      {paymentStatus === "success" && <PaymentResult status="Successful" />}
      {paymentStatus === "failed" && <PaymentResult status="Failed" />}
      <ThreeDSecure state={tds}>
        <Modal animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeCustomModal}>
                  <Image
                    source={require("./assets/cancel.png")}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              <ThreeDSecure.Frame />
            </View>
          </View>
        </Modal>
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
        <ScrollView style={styles.scroll}>
          <Text style={styles.title}>evervault react native</Text>
          <CardForm setCardData={setCardData} />
          <StatusBar style="auto" />
          {/* <CustomThreeDSecureCheckout cardData={cardData}/> */}
          <Checkout cardData={cardData} />
        </ScrollView>
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
    padding: 5,
  },
  modalContent: {
    width: "100%",
    height: "60%",
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
  },
  image: {
    width: 70, // Set the width of the image
    height: 20, // Set the height of the image
  },
});
