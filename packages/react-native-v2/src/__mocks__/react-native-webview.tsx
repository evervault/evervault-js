import { View } from "react-native";
import type { WebViewProps } from "react-native-webview";

export function WebView(props: WebViewProps) {
  return <View testID="webview" {...props} />;
}
