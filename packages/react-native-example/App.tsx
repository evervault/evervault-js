import { StatusBar } from "expo-status-bar";
import {
  Button,
  Modal,
  Platform,
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
  useThreeDSecureCancelSession,
  ThreeDSecure,
  useThreeDSecure,
} from "@evervault/evervault-react-native";
import { useState } from "react";
import CardDebug from "./components/CardDebug";
import CardForm from "./components/CardForm";

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    "Missing Evervault environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example."
  );
}

function Checkout() {

  const session = useThreeDSecure('SESSION ID', {
    onSuccess: () => {
      console.log("3DS successful");
    },
    onFailure: (error: Error) => {
      console.error("3DS failed", error);
    },
    onError: (error: Error) => {
      console.log("3DS errored", error);
    },
  });

  const handlePayment = () => {
    session.start();
  }

  return (
    <>
      <ThreeDSecureModal session={session} />
      <Button title="Pay" onPress={handlePayment} />
    </>
  );
}

function CustomThreeDSecureModal() {

  //Fetch the cancel method can be called on a custom close button
  const cancel3DSSession = useThreeDSecureCancelSession();

  const closeCustomModal = async () => {
    await cancel3DSSession();
  };


  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={closeCustomModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={closeCustomModal}>
            <Text>CLOSE</Text>
          </TouchableOpacity>
          <ThreeDSecure.Frame />
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);
  const [threeDSecureRequired, setThreeDSecureRequired] = useState(false);

  const start3DS = () => {
    setThreeDSecureRequired(true);
  };

  const callbacks = {
    onSuccess: () => {
      console.log("3DS successful");
      setThreeDSecureRequired(false);
    },
    onFailure: (error: Error) => {
      console.error("3DS failed", error);
      setThreeDSecureRequired(false);
    },
    onError: (error: Error) => {
      console.log("3DS errored", error);
      setThreeDSecureRequired(false);
    },
  };

  return (
    <EvervaultProvider
      teamId={process.env.EXPO_PUBLIC_EV_TEAM_UUID}
      appId={process.env.EXPO_PUBLIC_EV_APP_UUID}
    >
      <SafeAreaView style={styles.container}>
          <>
            <ScrollView style={styles.scroll}>
              <Text style={styles.title}>evervault react native</Text>
              <CardDebug cardData={cardData} />
              <CardForm setCardData={setCardData} />
              <Text style={styles.details}>
                {JSON.stringify(cardData, null, 2)}
              </Text>
              <StatusBar style="auto" />
              <Checkout />
            </ScrollView>
          <Button title="Start 3DS with custom modal" onPress={start3DS} />
        </>
        {threeDSecureRequired && (
          <ThreeDSecure sessionId="SESSION ID" callbacks={callbacks}>
            <CustomThreeDSecureModal />
          </ThreeDSecure>
        )}
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "100%",
    height: "95%",
    backgroundColor: "#fff",
    padding: 0,
    justifyContent: "flex-start",
  },
  details: {
    marginTop: 24,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospaced",
    }),
  },
});
