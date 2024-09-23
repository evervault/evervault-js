import { View, Text, StyleSheet } from 'react-native';

function CardDebug({ cardData }: { cardData: CardPayload | undefined }) {
  return (
    <View style={debugStyles.container}>
      <Text>
        {"Valid Card: "}
        <Text
          lineBreakMode="clip"
          style={cardData?.isValid ? debugStyles.success : debugStyles.danger}
        >
          {cardData?.isValid ? "true" : "false"}
        </Text>
      </Text>

      <Text>
        {"Fields Complete: "}
        <Text style={cardData?.isComplete ? debugStyles.success : debugStyles.danger}>
          {cardData?.isComplete ? "true" : "false"}
        </Text>
      </Text>


      <Text>
        {"Encrypted Card Number: "}
        <Text
          numberOfLines={1}
          lineBreakMode="clip"
          style={debugStyles.enc}
        >
          {cardData?.card.number}
        </Text>
      </Text>
    </View>
  )
}

export default CardDebug;

const debugStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 6,
    borderColor: "rgba(0, 0, 0, 0.2)",
    padding: 12,
    marginVertical: 20,
  },
  key: {
    fontWeight: '600',
  },
  success: {
    color: '#16a34a',
  },
  danger: {
    color: '#dc2626',
  },
  enc: {
    color: '#63e'
  }
});
