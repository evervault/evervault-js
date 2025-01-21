import { EvervaultProvider } from "@evervault/react";
import { UIComponent } from "./UIComponent";
import { useSearchParams } from "./utilities/useSearchParams";

const DEFAULT_CUSTOM_CONFIG = {
  jsSdkUrl: import.meta.env.VITE_EVERVAULT_JS_URL as string,
  urls: {
    keysUrl: import.meta.env.VITE_KEYS_URL as string,
    apiUrl: import.meta.env.VITE_API_URL as string,
  },
};

export default function App() {
  const { team, app, jsSdkUrl, keysUrl, apiUrl } = useSearchParams();

  const customConfig = {
    jsSdkUrl: jsSdkUrl ?? DEFAULT_CUSTOM_CONFIG.jsSdkUrl,
    urls: {
      keysUrl: keysUrl ?? DEFAULT_CUSTOM_CONFIG.urls.keysUrl,
      apiUrl: apiUrl ?? DEFAULT_CUSTOM_CONFIG.urls.apiUrl,
    },
  };

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
