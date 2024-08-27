import { StatusBar } from 'expo-status-bar';
import { Button, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { Card, CardPayload, init, ThreeDSProcess } from '@evervault/evervault-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import CardDebug from './components/CardDebug';
import CardForm from './components/CardForm';

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    'Missing Evervault environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example.'
  );
}


export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);
  const [isThreeDSActive, setIsThreeDSActive] = useState(false);

  useEffect(() => {
    async function setupEvervault() {
      try {
        await init(process.env.EXPO_PUBLIC_EV_TEAM_UUID, process.env.EXPO_PUBLIC_EV_APP_UUID);
      } catch (err) {
        console.log(err);
        throw new Error("Failed to initialize Evervault", err);
      }
    }
    setupEvervault();
  }, []);

  const callbacks = {
    onSuccess: () => {
      console.log('3DS Success');
      setIsThreeDSActive(false);
      // Handle success (e.g., update state, navigate, etc.)
    },
    onFailure: (error) => {
      console.error('3DS Failure', error);
      setIsThreeDSActive(false);
      // Handle failure (e.g., show error message)
    },
    onCanceled: () => {
      console.log('3DS Canceled');
      setIsThreeDSActive(false);
      // Handle cancellation (e.g., show message, reset state)
    }
  };

  const startThreeDS = () => {
    setIsThreeDSActive(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Button title="Start 3DS from EV app" onPress={() => startThreeDS()}/>
        <Text style={styles.title}>evervault react native</Text>
        <CardDebug cardData={cardData} />
        <CardForm setCardData={setCardData} />
        <Text style={styles.details}>{JSON.stringify(cardData, null, 2)}</Text>
        <StatusBar style="auto" />

        {isThreeDSActive && (
          <ThreeDSProcess 
            sessionId="tds_visa_81fcd7b85453" 
            appId="app_ee564ccddba7"
            teamId="7793170df6a4"
            callbacks={callbacks}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
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
    gap: 24
  },
  input: {
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  details: {
    marginTop: 24,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospaced'
    }),
  }
});
