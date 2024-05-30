import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { registerRootComponent } from 'expo';
import { Card, CardPayload, init } from '@evervault/evervault-react-native';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    async function setupEvervault() {
      try {
        await init(process.env.EXPO_PUBLIC_EV_TEAM_UUID, process.env.EXPO_PUBLIC_EV_APP_UUID);
      } catch (err) {
        throw new Error("Failed to initialize Evervault", err);
      }
    }
    setupEvervault();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>evervault react native</Text>
      <Card
        onChange={setCardData}
        style={styles.card}
      >
        <Text>Card Number</Text>
        <Card.Number
          placeholder="4242 4242 4242 4242"
          style={styles.input}
        />
        <Card.Expiry
          placeholder="MM / YY"
          style={styles.input}
        />
        <Card.Holder
          placeholder="John Doe"
          style={styles.input}
        />
        <Card.CVC
          placeholder="523"
          style={styles.input}
        />
      </Card>
      <Text style={styles.details}>{JSON.stringify(cardData, null, 2)}</Text>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
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
