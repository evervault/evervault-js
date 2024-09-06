import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BACKEND_API_KEY = process.env.EXPO_EV_BACKED_TOKEN;

interface CreateThreeDSecureSessionParams {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
  }
  
  interface CreateThreeDSecureSessionResponse {
    id: string;
  }

export const create3DSecureSession = async ({cardNumber, expiryMonth, expiryYear}: CreateThreeDSecureSessionParams): Promise<string> => {
    console.log(`Creating 3DS session for card ${cardNumber} expiring ${expiryMonth}/${expiryYear}`);
    const response = await fetch("https://api.evervault.com/payments/3ds-sessions", {
      method: 'POST',
      headers: {
        Authorization: `Basic ${BACKEND_API_KEY}`,
        'Content-Type': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        card: {
          number: cardNumber,
          expiry: {
            month: expiryMonth,
            year: expiryYear,
          },
        },
        merchant: {
          name: "Ollivanders Wand Shop",
          website: "https://www.ollivanders.co.uk",
          categoryCode: "5945",
          country: "ie",
        },
        acquirer: {
          bin: "414141",
          merchantIdentifier: "18463590293743",
          country: "ie",
        },
        payment: {
          type: "one-off",
          amount: 12300,
          currency: "eur",
        },
      }),
    });
  
    if (!response.ok) {
      console.log(`Failed to create 3DS session: ${response}`);
    }

    const payload = await response.json();
    console.log(`3DS session created: ${JSON.stringify(payload, null, 2)}`);
    const { id: sessionId }: CreateThreeDSecureSessionResponse = payload;
    return sessionId;
  };


  export const PaymentResult = ({status}) => {
    return (
      <View style={tempStyles.container}>
        <View style={tempStyles.box}>
          <Text style={tempStyles.text}>Payment {status}!</Text>
        </View>
      </View>
    );
  };
  
  const tempStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f0f0f0',  // Light grey background for the page
    },
    box: {
      paddingVertical: 20,
      paddingHorizontal: 40,
      backgroundColor: '#ffffff',  // White background for the box
      borderColor: '#007BFF',  // Blue border around the box
      borderWidth: 2,
      borderRadius: 8,  // Rounded corners
      shadowColor: '#000',  // Shadow color (black)
      shadowOffset: { width: 0, height: 2 },  // Offset for the shadow
      shadowOpacity: 0.1,  // Shadow opacity
      shadowRadius: 4,  // Blur radius of the shadow
      elevation: 3,  // Elevation for Android shadow
    },
    text: {
      fontSize: 24,  // Larger font size for the text
      color: '#007BFF',  // Blue text color
      fontWeight: 'bold',  // 
      textAlign: 'center',  // Centered text inside the box
    },
  });
  