import { useEffect, useState } from 'react';
import { Image, StyleSheet, Platform } from 'react-native';
import { init, encrypt } from '@evervault/evervault-react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

if (
  !process.env.EXPO_PUBLIC_EV_TEAM_UUID ||
  !process.env.EXPO_PUBLIC_EV_APP_UUID
) {
  throw new Error(
    'Missing environment variables. Please ensure you have setup your .env file correctly. See .env.example for an example.'
  );
}

const monoFont = Platform.select({
  ios: 'Menlo', // Common monospace font for iOS
  android: 'monospace', // Generic monospace font family for Android
});

export default function HomeScreen() {
  const [encryptedData, setEncrypytedData] = useState<string | undefined>(
    undefined
  );
  const [encryptedArr, setEncryptedArr] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    async function initEvervault() {
      try {
        await init(
          process.env.EXPO_PUBLIC_EV_TEAM_UUID as string,
          process.env.EXPO_PUBLIC_EV_APP_UUID as string
        );

        const encObject = await encrypt({
          key: 'value',
          boolKey: true,
          numberKey: 123,
        });

        const encArray = await encrypt(['encrypt', 'me', 'please']);

        setEncrypytedData(encObject);
        setEncryptedArr(encArray);
      } catch (error) {
        console.error(error);
      }
    }
    initEvervault();
  }, []);

  return (
    <ParallaxScrollView
      backgroundColor={'#A1CEDC'}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="subtitle">evervault-react-native</ThemedText>
      </ThemedView>
      <ThemedText type="default">Encrypted Data:</ThemedText>
      <ThemedText style={{ fontFamily: monoFont }}>
        {JSON.stringify(encryptedData, null, '  ')}
      </ThemedText>
      <ThemedText type="default">Encrypted Array:</ThemedText>
      <ThemedText style={{ fontFamily: monoFont }}>
        {JSON.stringify(encryptedArr, null, '  ')}
      </ThemedText>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
