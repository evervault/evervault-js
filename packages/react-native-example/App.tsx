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
  const session = useThreeDSecure("tds_visa_f2abad5ed5d7", {
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

  return (
    <>
      <ThreeDSecureModal session={session} />
      <Button title="Start 3DS from EV app" onPress={() => session.start()} />
    </>
  );
}

function CustomNestedCheckout() {

  //Fetch the cancel method can be called on a custom close button
  const cancel3DSSession = useThreeDSecureCancelSession();

  const closeCustomModal = async () => {
    await cancel3DSSession();
  };

  return (
    <>
      <TouchableOpacity onPress={() => closeCustomModal()}>
        <Text>CLOSE</Text>
      </TouchableOpacity>
      <ThreeDSecure.Frame />
    </>
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
        {!threeDSecureRequired && (
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
              <Button title="Start 3DS" onPress={start3DS} />
            </ScrollView>
          </>
        )}
        {/* {threeDSecureRequired && (
          <ThreeDSecure sessionId="tds_visa_59301c354d7d" callbacks={callbacks}>
            <CustomNestedCheckout />
          </ThreeDSecure>
        )} */}
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
    justifyContent: "flex-end", // Pushes the modal to the bottom of the screen
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    width: "100%",
    height: "95%", // Set the modal height to 90% of the screen
    backgroundColor: "#fff",
    padding: 0, // Remove padding to avoid squashing the content
    justifyContent: "flex-start", // Align content to the top inside the modal
  },
  details: {
    marginTop: 24,
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospaced",
    }),
  },
});
