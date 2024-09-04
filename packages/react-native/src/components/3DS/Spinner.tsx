import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const Spinner = () => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 700,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.spinnerContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg
          width={24}
          height={24}
          fill="none"
          viewBox="0 0 24 24"
        >
          <Path
            stroke="#5e6077"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});