import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EvervaultPaymentView, Config, Transaction } from './EvervaultPaymentView';

const ExampleUsage: React.FC = () => {
  const config: Config = {
    appId: "YOUR_EVERVAULT_APP_ID",
    merchantId: "YOUR_EVERVAULT_MERCHANT_ID"
  };

  const transaction: Transaction = {
    amount: 430000, // $4,300.00 in cents
    currency: "USD",
    country: "US",
    merchantId: "YOUR_EVERVAULT_MERCHANT_ID",
    lineItems: [
      {
        label: "First Edition \"The Great Gatsby\" (1925)",
        amount: 245000, // $2,450.00 in cents
        quantity: 1
      },
      {
        label: "Signed \"One Hundred Years of Solitude\" (1967)",
        amount: 185000, // $1,850.00 in cents
        quantity: 1
      }
    ]
  };

  const handleSuccess = () => {
    console.log('Payment processed successfully!');
  };

  const handleError = (error: string) => {
    console.error('Payment error:', error);
  };

  const handleCancel = () => {
    console.log('Payment cancelled');
  };

  return (
    <View style={styles.container}>
      <EvervaultPaymentView
        config={config}
        transaction={transaction}
        buttonType="pay"
        buttonTheme="black"
        borderRadius={15}
        allowedAuthMethods={['PAN_ONLY', 'CRYPTOGRAM_3DS']}
        allowedCardNetworks={['VISA', 'MASTERCARD']}
        onSuccess={handleSuccess}
        onError={handleError}
        onCancel={handleCancel}
        style={styles.paymentButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  paymentButton: {
    width: '100%',
    height: 60,
  },
});

export default ExampleUsage; 