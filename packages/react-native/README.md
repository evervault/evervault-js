# react-native-evervault-sdk

## [Documentation](https://docs.evervault.com/sdks/react-native)

Please see our documentation site for a full guide and reference.

## Installation

```sh
npm install @evervault/evervault-react-native
```

or

```sh
yarn add @evervault/evervault-react-native
```

## Usage

```tsx
import { EvervaultProvider, init, Card, type CardPayload } from "@evervault/evervault-react-native";

export default function App() {
  const [cardData, setCardData] = useState<CardPayload | undefined>(undefined);

  const handleCardChange = (data: CardPayload) => {
    setCardData(data);

    if (data.isComplete) {
      // note that the user can enter further data even when the Card is in a complete state.
      // For example entering the remainder of their name after the first few characters.
      console.log("Card is complete!");
    }
  };

  return (
    <EvervaultProvider teamUuid="team_4fb7e6ec803f" appUuid="app_f0cb771c8e77">
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>evervault react native</Text>
        <Card onChange={setCardData} style={styles.card}>
          <Text>Card Number</Text>
          <Card.Number placeholder="4242 4242 4242 4242" style={styles.input} />
          <Card.Expiry placeholder="MM / YY" style={styles.input} />
          <Card.Holder placeholder="John Doe" style={styles.input} />
          <Card.CVC placeholder="523" style={styles.input} />
        </Card>
        <Text style={styles.details}>{JSON.stringify(cardData, null, 2)}</Text>
        <StatusBar style="auto" />
      </ScrollView>
    </EvervaultProvider>
  );
}
```
