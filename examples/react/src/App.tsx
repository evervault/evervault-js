import { Card, CardPayload, EvervaultProvider, themes } from "@evervault/react";
import React, { useRef } from "react";

const theme = themes.clean({
  styles: {
    label: {
      color: "#6633ee",
    },
  },
});

const customConfig = {
  jsSdkUrl: import.meta.env.VITE_EVERVAULT_JS_URL as string,
  urls: {
    keysUrl: import.meta.env.VITE_KEYS_URL as string,
    apiUrl: import.meta.env.VITE_API_URL as string,
    componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL as string,
  },
};

// Uncomment to force script failure (onLoadError)
// customConfig.jsSdkUrl = "https://failure.evervault.com/v2";

function App() {
  const handleChange = (payload: CardPayload) => {
    console.log(payload);
  };

  const [retry, setRetry] = React.useState(0);
  const ref = useRef<EvervaultProvider>(null);

  return (
    <EvervaultProvider
      key={retry}
      ref={ref}
      teamId={import.meta.env.VITE_EV_TEAM_UUID}
      appId={import.meta.env.VITE_EV_APP_UUID}
      customConfig={customConfig}
      onLoadError={(error) => {
        console.error("Custom onLoadError", error);
      }}
    >
      <h1>Example React app</h1>
      <button onClick={() => setRetry((prev) => prev + 1)}>Retry</button>
      <button onClick={() => ref.current?.reload()}>Reload script</button>
      <Card icons onChange={handleChange} theme={theme} />
    </EvervaultProvider>
  );
}

export default App;
