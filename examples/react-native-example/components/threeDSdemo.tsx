import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';



interface CreateThreeDSecureSessionParams {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
  }
  
  interface CreateThreeDSecureSessionResponse {
    session: {
      id: string;
    };
  }

  export const create3DSecureSession = async ({
    cardNumber,
    expiryMonth,
    expiryYear,
  }: CreateThreeDSecureSessionParams): Promise<string | null> => {
    try {
      console.log(
        `Creating 3DS session for card ${cardNumber} expiring ${expiryMonth}/${expiryYear}`
      );
      const response = await fetch(
        `http://localhost:${
          process.env.EXPO_PUBLIC_EV_PORT ?? 8008
        }/3ds-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cardNumber,
            expiryMonth,
            expiryYear,
          }),
        }
      );

      if (!response.ok) {
        const payload = await response.json();
        console.log(
          `Failed to create 3DS session: ${JSON.stringify(
            payload,
            undefined,
            2
          )}`
        );
        return null;
      }

      const payload =
        (await response.json()) as CreateThreeDSecureSessionResponse;
      console.log(`3DS session created: ${JSON.stringify(payload, null, 2)}`);
      const {
        session: { id: sessionId },
      } = payload;
      return sessionId;
    } catch (error) {
      console.error("Failed to create 3DS session", error);
      return null;
    }
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

  export const closeCustomModalWithAlert = async ({cancel}) => {
    Alert.alert(
      "Confirm cancel payment?",
      "Are you sure you want cancel payment verification?",
      [
        {
          text: "Don't Cancel",
          onPress: () => console.log("Modal close canceled"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            await cancel();
          },
        },
      ],
      { cancelable: true }
    );
  };
  