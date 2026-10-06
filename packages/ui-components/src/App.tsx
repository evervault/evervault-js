import { EvervaultProvider } from "@evervault/react";
import { UIComponent } from "./UIComponent";
import { sdkConfig } from "./utilities/config";
import { useSearchParams } from "./utilities/useSearchParams";

const customConfig = {
  jsSdkUrl: sdkConfig.jsSdkUrl,
  urls: {
    keysUrl: sdkConfig.keysUrl,
    apiUrl: sdkConfig.apiUrl,
  },
};

export default function App() {
  const { team, app } = useSearchParams();

  // Throw an error if team or app are missing
  if (!team || !app) {
    throw new Error("Missing team, app or component");
  }

  return (
    <EvervaultProvider teamId={team} appId={app} customConfig={customConfig}>
      <UIComponent />
    </EvervaultProvider>
  );
}
