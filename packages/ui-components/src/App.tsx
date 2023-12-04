import { EvervaultProvider } from "@evervault/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pin } from "./Pin";
import { CardDetails } from "./CardDetails";
import { resize } from "./utilities/resize";
import { useSearchParams } from "./utilities/useSearchParams";
import { useMessaging } from "./utilities/useMessaging";
import { RevealRequest } from "./Reveal/RevealRequest";
import { RevealText } from "./Reveal/RevealText";
import { RevealCopyButton } from "./Reveal/RevealCopyButton";
import { useTheme } from "./utilities/useTheme";

const COMPONENTS = {
  Pin,
  RevealText,
  RevealRequest,
  RevealCopyButton,
  CardDetails,
};

const customConfig = {
  jsSdkUrl: import.meta.env.VITE_EVERVAULT_JS_URL,
  urls: {
    keysUrl: import.meta.env.VITE_KEYS_URL,
    apiUrl: import.meta.env.VITE_API_URL,
  },
};

export default function App() {
  const setTheme = useTheme();
  const initialized = useRef(false);
  const [config, setConfig] = useState<any | null>(null);
  const { on, send } = useMessaging();
  const { team, app, component } = useSearchParams();

  // Throw an error if team, app or component isn't set.
  if (!team || !app || !component) {
    throw new Error("Missing team, app or component");
  }

  // Trigger a resize any time there is an app rerender.
  useLayoutEffect(resize);

  // Send a message to the parent window to let it know that the frame is ready
  // to recieve messages. This will trigger the parent to send an EV_INIT event
  // with the configuration for the component.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    send("EV_FRAME_HANDSHAKE");
  }, [send]);

  // Wait for the parent frame to fire an EV_INIT event and store the passed
  // theme and config.
  useEffect(() => {
    return on("EV_INIT", (payload) => {
      setTheme(payload.theme || null);
      setConfig(payload.config);
      send("EV_FRAME_READY");
    });
  }, [on, send, setTheme]);

  // update the theme and config any time the parent frame fires EV_UPDATE
  useEffect(() => {
    return on("EV_UPDATE", (payload) => {
      setTheme(payload.theme || null);
      if (typeof payload.config !== "undefined") {
        setConfig(payload.config);
      }
    });
  }, [on, setTheme]);

  // Return null until the parent frame has passed a config
  if (!config) return null;

  // Use the component query param to determine which component from the
  // COMPONENTS map to render.
  const Component = COMPONENTS[component as keyof typeof COMPONENTS];
  if (!Component) {
    console.warn("Unknown component", component);
    return null;
  }

  return (
    <EvervaultProvider teamId={team} appId={app} customConfig={customConfig}>
      <Component config={config} />
    </EvervaultProvider>
  );
}
