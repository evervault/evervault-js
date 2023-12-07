import {
  Card,
  CardPayload,
  EvervaultProvider,
  themes,
} from "@evervault/react";

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

  return (
    <EvervaultProvider
      teamId={import.meta.env.VITE_EV_TEAM_UUID}
      appId={import.meta.env.VITE_EV_APP_UUID}
      customConfig={customConfig}
    >
      <h1>Example React app</h1>
      <Card onChange={handleChange} theme={theme} />
    </EvervaultProvider>
  );
}

export default App;
