import { Button, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";


type SessionStatus = 'action-required' | 'success' | 'failure';

export interface ThreeDSSessionResponse {
    nextAction: {
        type: string;
        url?: string;
        creq?: string;
    };
    status: SessionStatus;
}

const app = "app_ee564ccddba7";
const team = "7793170df6a4";

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

const getSessionStatus = async (sessionId: string): Promise<ThreeDSSessionResponse> => {
    try {
        const response = await fetch(`https://api.evervault.com/frontend/3ds/browser-sessions/${sessionId}`, {
            headers: {
            "x-evervault-app-id": app
            }
        });
        return response.json() as Promise<ThreeDSSessionResponse>;
    } catch (error) {
        console.error("Error fetching session status", error);
        throw error;
    }
};


const sleep = (timeout: number) =>
  new Promise((res) => setTimeout(res, timeout));

const ThreeDS = (sessionId: string) => {
  const [attempts, setAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  useInterval(
    async () => {
      console.log(`Polling API! ${attempts}`);
      const response: ThreeDSSessionResponse = await getSessionStatus("tds_mastercard_30bd99f83797");
      console.log("Poll Complete! ", response);

      if (response.status === "success") {
        console.log("3DS Complete!");
        WebBrowser.dismissBrowser();
        setIsPolling(false);
      }

      setAttempts((a) => a + 1);

      if (attempts > 10) {
        WebBrowser.dismissBrowser();
        setIsPolling(false);
      }
    },
    isPolling ? 3000 : null
  );

  const start3DS = async () => {
    setIsPolling(true);
    await WebBrowser.openBrowserAsync(`https://e0d6-2a09-bac5-37b9-ebe-00-178-198.ngrok-free.app/?session=tds_mastercard_30bd99f83797&app=app_ee564ccddba7&team=7793170df6a4`, {
        showInRecents: true,
        dismissButtonStyle: "cancel",
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,

    });
  };

return (
    <View>
        <Button onPress={() => start3DS()} title="Start 3DS" />
    </View>
);
};

export default ThreeDS;