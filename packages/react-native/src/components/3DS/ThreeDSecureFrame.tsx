import React, { useContext } from "react";
import { View } from "react-native";
import { useEvervault } from "../EvervaultProvider";
import WebView from "react-native-webview";
import { CHALLENGE_DOMAIN_3DS } from "./config";
import { defaultThreeDSecureFrameStyles as defaultStyles } from "./styles";
import { ThreeDSecureContext } from "./context";

export function ThreeDSecureFrame() {
  const { teamUuid, appUuid } = useEvervault();
  const context = useContext(ThreeDSecureContext);

  if (!teamUuid || !appUuid) {
    throw new Error(
      "Missing Evervault Team or App Uuid. Make sure the ThreeDSecureFrame is nested within the Evervault Provider"
    );
  }

  if (!context) {
    throw new Error(
      "ThreeDSecure.Frame must be used within an Evervault ThreeDSecure provider component"
    );
  }

  const { session } = context;

  if (!session) {
    return null; // 3DS Session not started yet
  }

  return (
    <View style={defaultStyles.threeDSFrame}>
      <WebView
        source={{
          uri: `https://${CHALLENGE_DOMAIN_3DS}/?session=${session.sessionId}&app=${appUuid}&team=${teamUuid}`,
        }}
        containerStyle={defaultStyles.webView}
        overScrollMode="content"
      />
    </View>
  );
}
