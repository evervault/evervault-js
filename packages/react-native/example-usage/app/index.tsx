/* eslint-disable react-native/no-inline-styles */
import { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import {
  init,
  Card,
  type CardPayload,
} from '@evervault/evervault-react-native';

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    'Missing environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example.'
  );
}

export default function HomeScreen() {
  const [cardData, setCardData] = useState<CardPayload | null>(null);

  useEffect(() => {
    async function initEvervault() {
      try {
        await init(
          process.env.EXPO_PUBLIC_EV_TEAM_UUID as string,
          process.env.EXPO_PUBLIC_EV_APP_UUID as string
        );
      } catch (error) {
        console.error(error);
      }
    }
    initEvervault();
  }, []);

  return (
    <ScrollView style={{ paddingHorizontal: 24 }}>
      <View style={{ paddingVertical: 36 }}>
        <Text style={{ fontWeight: 600, fontSize: 24 }}>
          evervault-react-native
        </Text>
      </View>
      <View style={{ gap: 12 }}>
        <Card onChange={setCardData} style={{ gap: 24 }}>
          <Card.Number placeholder="4242 4242 4242 4242" />
          <Card.CVC placeholder="123" />
          <Card.Holder placeholder="Mark Doyle" />
        </Card>
      </View>
      <Text>{JSON.stringify(cardData, null, '   ')}</Text>
    </ScrollView>
  );
}
