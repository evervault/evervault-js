import { Card, CardPayload } from "@evervault/evervault-react-native";
import { StyleSheet } from "react-native";

interface CardFormProps {
  setCardData: (payload: CardPayload) => void;
}

function CardForm({ setCardData }: CardFormProps) {
  return (
    <Card onChange={setCardData} style={styles.card}>
      <Card.Number
        placeholder="4242 4242 4242 4242"
        style={styles.input}
        onFocus={() => console.log("on focus!")}
        onBlur={() => console.log("on blur!")}
      />
      <Card.Expiry placeholder="MM / YY" style={styles.input} />
      <Card.Holder placeholder="John Doe" style={styles.input} />
      <Card.CVC placeholder="123" style={styles.input} />
    </Card>
  );
}

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
});

export default CardForm;
