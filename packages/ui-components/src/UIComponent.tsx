import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card } from "./Card";
import {Form} from "./Form";
import {FormConfig} from "./Form/types";
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
import { ThreeDS } from "./3DS";
import { ThreeDSConfig } from "./3DS/types";

// Use the component query param to determine which component to render
export function UIComponent() {
  const setTheme = useTheme();
  const initialized = useRef(false);
  const { on, send } = useMessaging();
  const readyFired = useRef(false);
  const [config, setConfig] = useState<unknown>(null);
  const { component } = useSearchParams();

  // Trigger a resize any time there is an app rerender.
  useLayoutEffect(resize);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        resize();
      }, 50);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      }),
    [on, send, setTheme]
  );

  useEffect(() => {
    if (!config || readyFired.current) return;
    send("EV_FRAME_READY");
    readyFired.current = true;
  }, [send, config]);

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

  if (component === "Form") {
    return <Form config={config as FormConfig} />;
  }

  if (component === "ThreeDS") {
    return <ThreeDS config={config as ThreeDSConfig} />;
  }

  throw new Error(`Unknown component ${component}`);
}
