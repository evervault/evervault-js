import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useEvervault } from "../EvervaultProvider";
import WebView from "react-native-webview";
import { CHALLENGE_DOMAIN_3DS } from "./config";
import { Spinner } from "./Spinner";
import { defaultThreeDSecureFrameStyles as defaultStyles } from "./styles";

interface ThreeDSecureFrameProps {
  sessionId: string;
}

export function ThreeDSecureFrame({ sessionId }: ThreeDSecureFrameProps) {
  const { teamUuid, appUuid } = useEvervault();
  const [loading, setLoading] = useState(true);

  if (!teamUuid || !appUuid) {
    throw new Error('Missing Evervault Team or App Uuid. Make sure the ThreeDSecureFrame is nested within the Evervault Provider');
  }

  return (
    <View style={defaultStyles.threeDSFrame}>
      {loading && (
        <View style={defaultStyles.spinnerOverlay}>
          <Spinner />
        </View>
      )}
      <WebView
        source={{
          uri: `https://${CHALLENGE_DOMAIN_3DS}/?session=${sessionId}&app=${appUuid}&team=${teamUuid}`,
        }}
        containerStyle={defaultStyles.webView}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        overScrollMode="content"
      />
    </View>
  );
}