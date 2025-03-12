import { useContext, useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useEvervault } from "../useEvervault";
import { WebView } from "react-native-webview";
import { CHALLENGE_DOMAIN_3DS } from "./config";
import { ThreeDSecureContext } from "./context";

export interface ThreeDSecureFrameProps {
  style?: StyleProp<ViewStyle>;
}

export function ThreeDSecureFrame({ style }: ThreeDSecureFrameProps) {
  const evervault = useEvervault();

  const context = useContext(ThreeDSecureContext);
  if (!context) {
    throw new Error(
      "`ThreeDSecure.Frame` must be used within a `ThreeDSecure` component."
    );
  }

  const uri = useMemo(() => {
    if (!context.session) return null;

    const params = new URLSearchParams();
    params.set("session", context.session.sessionId);
    params.set("app", evervault.appId);
    params.set("team", evervault.teamId);

    return `https://${CHALLENGE_DOMAIN_3DS}/?${params.toString()}`;
  }, [context.session, evervault.appId, evervault.teamId]);

  if (!uri) return null;

  return (
    <WebView
      containerStyle={[defaultStyles.webView, style]}
      source={{ uri }}
      overScrollMode="content"
    />
  );
}

const defaultStyles = StyleSheet.create({
  webView: {
    flex: 1,
  },
});
