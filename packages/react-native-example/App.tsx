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
  ThreeDS,
  ThreeDSModal,
  useThreeDS,
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

//Example of building your own custom modal using the ThreeDsComponents
// this should be nested within the ThreeDs provider component

// function PaymentChallengeModal() {
//   const {session, shouldShow3DSFrame} = useThreeDS();

//   const close3DS = async () => {
//     await session.cancel()
//   }

//   if (shouldShow3DSFrame) {
//     return <>
//         <Modal 
//             animationType="slide" 
//             transparent={true}
//         >
//           <View style={styles.modalContainer}>
//             <View style={styles.modalContent}>
//             <View style={[styles.titleBar]}>
//                     <TouchableOpacity style={[styles.closeButton]} onPress={close3DS}>
//                         <Text style={[styles.closeButtonText]}>X</Text>
//                     </TouchableOpacity>
//                     <Text style={[styles.titleText]}>
//                         Verification
//                     </Text>
//                 </View>
//               <ThreeDS.Frame/>
//           </View>
//         </View>
//       </Modal>
//     </>
//   } else {
//     return null;
//   }
// }

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

  const sessionId = "tds_visa_a4a81fc0e3c1"

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
          <ThreeDSModal sessionId={sessionId} callbacks={callbacks} />
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