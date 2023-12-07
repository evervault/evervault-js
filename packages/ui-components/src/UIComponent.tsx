import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card } from "./Card";
import { Pin } from "./Pin";
import { RevealCopyButton } from "./Reveal/RevealCopyButton";
import { RevealRequest } from "./Reveal/RevealRequest";
import { RevealText } from "./Reveal/RevealText";
import { resize } from "./utilities/resize";
import { useMessaging } from "./utilities/useMessaging";
import { useSearchParams } from "./utilities/useSearchParams";
import { useTheme } from "./utilities/useTheme";
import type { CardConfig } from "./Card/types";
import type { PinConfig } from "./Pin/types";
import type {
  RevealCopyButtonConfig,
  RevealRequestConfig,
  RevealTextConfig,
} from "./Reveal/types";

// Use the component query param to determine which component to render
export function UIComponent() {
  const setTheme = useTheme();
  const initialized = useRef(false);
  const { on, send } = useMessaging();
  const [config, setConfig] = useState<unknown>(null);
  const { component } = useSearchParams();

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
  useEffect(
    () =>
      on("EV_INIT", (payload) => {
        setTheme(payload.theme ?? null);
        setConfig(payload.config);
        send("EV_FRAME_READY");
      }),
    [on, send, setTheme]
  );

  // update the theme and config any time the parent frame fires EV_UPDATE
  useEffect(
    () =>
      on("EV_UPDATE", (payload) => {
        setTheme(payload.theme ?? null);
        if (typeof payload.config !== "undefined") {
          setConfig(payload.config);
        }
      }),
    [on, setTheme]
  );

  // Return null until the parent frame has passed a config
  if (!config) return null;

  if (component === "Card") {
    return <Card config={config as CardConfig} />;
  }

  if (component === "Pin") {
    return <Pin config={config as PinConfig} />;
  }

  if (component === "RevealRequest") {
    return <RevealRequest config={config as RevealRequestConfig} />;
  }

  if (component === "RevealText") {
    return <RevealText config={config as RevealTextConfig} />;
  }

  if (component === "RevealCopyButton") {
    return <RevealCopyButton config={config as RevealCopyButtonConfig} />;
  }

  throw new Error(`Unknown component ${component}`);
}
