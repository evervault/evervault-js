import React from "react";
import { createRoot } from "react-dom/client";
import { EvervaultProvider } from "@evervault/react";
import App from "./App";

// Environment variables
const TEAM_ID = import.meta.env.VITE_EV_TEAM_UUID;
const APP_ID = import.meta.env.VITE_EV_APP_UUID;

// Ensure environment variables are set
if (!TEAM_ID || !APP_ID) {
  throw new Error(
    "VITE_EV_TEAM_ID and VITE_EV_APP_ID must be set in your environment variables"
  );
}

// Get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

// Create a root
const root = createRoot(rootElement);

// Render the app
root.render(
  <React.StrictMode>
    <EvervaultProvider
      teamId={TEAM_ID}
      appId={APP_ID}
      customConfig={{
        jsSdkUrl: import.meta.env.VITE_EVERVAULT_JS_URL,
        urls: {
          keysUrl: import.meta.env.VITE_KEYS_URL,
          apiUrl: import.meta.env.VITE_API_URL,
          componentsUrl: import.meta.env.VITE_UI_COMPONENTS_URL,
        },
      }}
    >
      <App />
    </EvervaultProvider>
  </React.StrictMode>
);
