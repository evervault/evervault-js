import { StatusBar } from "expo-status-bar";
import {
  Button,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { registerRootComponent } from "expo";
import {
  type CardPayload,
  EvervaultProvider,
  ThreeDS,
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

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);
  const [isThreeDSActive, setIsThreeDSActive] = useState(false);

  const startThreeDS = () => {
    setIsThreeDSActive(true);
  };

  const closeThreeDS = () => {
    setIsThreeDSActive(false);
  };

  const callbacks = {
    onSuccess: () => {
      console.log('3DS successful');
      closeThreeDS();
    },
    onFailure: (error) => {
      console.error('3DS failed', error);
      closeThreeDS();
    },
    onCancel: () => {
      console.log('3DS canceled');
      closeThreeDS();
    },
  };

  return (
    <EvervaultProvider
      teamId={process.env.EXPO_PUBLIC_EV_TEAM_UUID}
      appId={process.env.EXPO_PUBLIC_EV_APP_UUID}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scroll}>
          <Text style={styles.title}>evervault react native</Text>
          <CardDebug cardData={cardData} />
          <CardForm setCardData={setCardData} />
          <Text style={styles.details}>
            {JSON.stringify(cardData, null, 2)}
          </Text>
          <StatusBar style="auto" />

          <Button title="Start 3DS from EV app" onPress={startThreeDS} />
        </ScrollView>
        {isThreeDSActive ? (
          <Modal 
            visible={isThreeDSActive} 
            animationType="slide" 
            transparent={true} // Makes the background transparent to better control the modal position
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ThreeDS 
                  sessionId="tds_visa_e460ac1e4231" 
                  callbacks={callbacks} 
                  config={{
                    titleBarText: "3DS Challenge",
                    dismissButtonLabel: "X"
                  }}
                  styles={{
                    titleBarStyle: {
                      backgroundColor: "white",
                      borderBottomWidth: 0
                    }
                  }}/>
              </View>
            </View>
          </Modal>
        ) : null}
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