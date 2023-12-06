import {
  CardDetails,
  CardDetailsPayload,
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

function App() {
  const handleChange = (payload: CardDetailsPayload) => {
    console.log(payload);
  };

  return (
    <EvervaultProvider
      teamId={import.meta.env.VITE_EV_TEAM_UUID}
      appId={import.meta.env.VITE_EV_APP_UUID}
    >
      <h1>Example React app</h1>
      <CardDetails onChange={handleChange} theme={theme} />
    </EvervaultProvider>
  );
}

export default App;
