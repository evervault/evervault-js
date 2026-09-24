import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FormConfig } from "./Form/types";
import { ThreeDSecureConfig } from "./ThreeDSecure/types";
import { resize } from "./utilities/resize";
import { useMessaging } from "./utilities/useMessaging";
import { useSearchParams } from "./utilities/useSearchParams";
import { useTheme } from "./utilities/useTheme";
import type { Card as CardComponent } from "./Card";
import type { CardConfig } from "./Card/types";
import type { Pin as PinComponent } from "./Pin";
import type { PinConfig } from "./Pin/types";
import type { RevealCopyButton as RevealCopyButtonComponent } from "./Reveal/RevealCopyButton";
import type { RevealRequest as RevealRequestComponent } from "./Reveal/RevealRequest";
import type { RevealText as RevealTextComponent } from "./Reveal/RevealText";
import type {
  RevealCopyButtonConfig,
  RevealRequestConfig,
  RevealTextConfig,
} from "./Reveal/types";
import type { Form as FormComponent } from "./Form";
import type { ThreeDSecure as ThreeDSecureComponent } from "./ThreeDSecure";
import type { GooglePay as GooglePayComponent } from "./GooglePay";
import { GooglePayConfig } from "./GooglePay/types";

export function loadComponent(component: string | undefined): Promise<unknown> {
  switch (component) {
    case "Card":
      return import("./Card").then((m) => m.Card);
    case "Pin":
      return import("./Pin").then((m) => m.Pin);
    case "Form":
      return import("./Form").then((m) => m.Form);
    case "ThreeDSecure":
      return import("./ThreeDSecure").then((m) => m.ThreeDSecure);
    case "GooglePay":
      return import("./GooglePay").then((m) => m.GooglePay);
    case "RevealRequest":
      return import("./Reveal/RevealRequest").then((m) => m.RevealRequest);
    case "RevealText":
      return import("./Reveal/RevealText").then((m) => m.RevealText);
    case "RevealCopyButton":
      return import("./Reveal/RevealCopyButton").then(
        (m) => m.RevealCopyButton
      );
    default:
      throw new Error(`Unknown component ${component}`);
  }
}

// Use the component query param to determine which component to render
export function UIComponent() {
  const setTheme = useTheme();
  const initialized = useRef(false);
  const readyFired = useRef(false);
  const { on, send } = useMessaging();
  const [config, setConfig] = useState<unknown>(null);
  const [loadedComponent, setLoadedComponent] = useState<unknown>(null);
  const { component } = useSearchParams();

  const [componentPromise] = useState(() => loadComponent(component));

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

  useEffect(() => {
    let cancelled = false;
    componentPromise
      .then((resolved) => {
        if (!cancelled) setLoadedComponent(() => resolved);
      })
      .catch(() => {
        if (cancelled) return;
        send("EV_ERROR", {
          code: "component-load-failed",
          message: "Failed to load the component. Please try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [componentPromise, send]);

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

  useEffect(() => {
    if (!config || !loadedComponent || readyFired.current) return;
    readyFired.current = true;
    send("EV_FRAME_READY");
  }, [config, loadedComponent, send]);

  if (!config || !loadedComponent) return null;

  return renderComponent(component, config, loadedComponent);
}

function renderComponent(
  component: string | undefined,
  config: unknown,
  loadedComponent: unknown
) {
  if (component === "Card") {
    const Card = loadedComponent as typeof CardComponent;
    return <Card config={config as CardConfig} />;
  }

  if (component === "Pin") {
    const Pin = loadedComponent as typeof PinComponent;
    return <Pin config={config as PinConfig} />;
  }

  if (component === "RevealRequest") {
    const RevealRequest = loadedComponent as typeof RevealRequestComponent;
    return <RevealRequest config={config as RevealRequestConfig} />;
  }

  if (component === "RevealText") {
    const RevealText = loadedComponent as typeof RevealTextComponent;
    return <RevealText config={config as RevealTextConfig} />;
  }

  if (component === "RevealCopyButton") {
    const RevealCopyButton =
      loadedComponent as typeof RevealCopyButtonComponent;
    return <RevealCopyButton config={config as RevealCopyButtonConfig} />;
  }

  if (component === "Form") {
    const Form = loadedComponent as typeof FormComponent;
    return <Form config={config as FormConfig} />;
  }

  if (component === "ThreeDSecure") {
    const ThreeDSecure = loadedComponent as typeof ThreeDSecureComponent;
    return <ThreeDSecure config={config as ThreeDSecureConfig} />;
  }

  if (component === "GooglePay") {
    const GooglePay = loadedComponent as typeof GooglePayComponent;
    return <GooglePay config={config as GooglePayConfig} />;
  }

  throw new Error(`Unknown component ${component}`);
}
