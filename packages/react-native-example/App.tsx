import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { registerRootComponent } from 'expo';
import { Card, type CardPayload } from '@evervault/evervault-react-native';
import { useState } from 'react';

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);

  return (
    <View style={styles.container}>
      <Card onComplete={setCardData} style={{ width: "100%" }}>
        <Card.Number style={styles.input} />
      </Card>
      <Text style={{ fontFamily: 'monospace' }}>
        {JSON.stringify(cardData, null, 2)}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 5,
    width: "100%",
  }
});
