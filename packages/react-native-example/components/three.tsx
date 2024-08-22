import { Button, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";

function useInterval(callback: () => void, delay: number | undefined) {
  const intervalRef = useRef(null);
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(tick, delay);
      return () => window.clearInterval(intervalRef.current);
    }
  }, [delay]);

  return intervalRef;
}

const ThreeDS = () => {
  const [attempts, setAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  useInterval(
    () => {
      console.log(`Polling API! ${attempts}`);
      setAttempts((a) => a + 1);

      if (attempts > 3) {
        WebBrowser.dismissBrowser();
        setIsPolling(false);
      }
    },
    isPolling ? 1000 : null
  );

  const start3DS = async () => {
    setIsPolling(true);
    await WebBrowser.openBrowserAsync("https://google.com");
  };

  return (
    <View>
      <Button onPress={start3DS} title="Start 3DS" />
    </View>
  );
};

export default ThreeDS;
