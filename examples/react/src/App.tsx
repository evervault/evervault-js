import { Card, CardPayload, EvervaultProvider, themes } from "@evervault/react";
import React from "react";

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

function App() {
  const handleChange = (payload: CardPayload) => {
    console.log(payload);
  };

  const [retry, setRetry] = React.useState(0);

  return (
    <EvervaultProvider
      key={retry}
      teamId={import.meta.env.VITE_EV_TEAM_UUID}
      appId={import.meta.env.VITE_EV_APP_UUID}
      customConfig={customConfig}
      onLoadError={() => {
        console.error("Custom onLoadError");
      }}
    >
      <h1>Example React app</h1>
      <button onClick={() => setRetry((prev) => prev + 1)}>Retry</button>
      <Card icons onChange={handleChange} theme={theme} />
    </EvervaultProvider>
  );
}

export default App;
