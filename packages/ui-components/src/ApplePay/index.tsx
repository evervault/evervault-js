import "./styles.css";
import { CSSProperties, useEffect, useLayoutEffect, useRef } from "react";
import { ApplePayConfig } from "./types";
import { resize, setSize } from "../utilities/resize";
import { buildSession, exchangeApplePaymentData } from "./utilities";
import { useSearchParams } from "../utilities/useSearchParams";
import { useMessaging } from "../utilities/useMessaging";
import {
  ApplePayClientMessages,
  EncryptedApplePayData,
  ApplePayHostMessages,
} from "types";

interface ApplePayProps {
  config: ApplePayConfig;
}

interface ApplePayButtonAttributes extends React.HTMLAttributes<HTMLElement> {
  buttonstyle?: string;
  type?: string;
  locale?: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "apple-pay-button": React.DetailedHTMLProps<
        ApplePayButtonAttributes,
        HTMLElement
      >;
    }
  }

  interface Window {
    ApplePaySession?: {
      new (
        version: number,
        request: ApplePayJS.ApplePayPaymentRequest
      ): ApplePaySession;
      canMakePayments(): boolean;
    };
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export function ApplePay({ config }: ApplePayProps) {
  const { app } = useSearchParams();
  const button = useRef<HTMLElement>(null);
  const initialized = useRef(false);
  const { on, send } = useMessaging<
    ApplePayHostMessages,
    ApplePayClientMessages
  >();

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const handleLoad = () => {
      resize();
      setSize({
        width: button.current?.offsetWidth || 0,
        height: button.current?.offsetHeight || 0,
      });
    };

    const script = document.createElement("script");
    script.src =
      "https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = handleLoad;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const handleClick = async () => {
      const session = buildSession(app, config);

      let response;
      try {
        response = await session.show();
      } catch (error) {
        if (error.name === "AbortError") {
          send("EV_APPLE_PAY_CANCELLED");
          return;
        } else {
          throw error;
        }
      }

      const {
        token: { paymentData },
      } = response.details;

      try {
        const encrypted: EncryptedApplePayData = await exchangeApplePaymentData(
          app,
          paymentData,
          config.transaction.merchant.id
        );

        send("EV_APPLE_PAY_AUTH", encrypted);

        const result = await new Promise<{ status: string }>((resolve) => {
          on("EV_APPLE_PAY_COMPLETION", () => {
            resolve({
              status: "success",
            });
            send("EV_APPLE_PAY_SUCCESS");
          });

          on("EV_APPLE_PAY_AUTH_ERROR", (error) => {
            const errorMsg = `Error during payment completion: ${error.message}`;
            resolve({
              status: "fail",
            });
            send("EV_APPLE_PAY_ERROR", errorMsg);
          });
        });
        await response.complete(result.status);
      } catch (error) {
        const errorMsg = `Error during payment completion. Error: ${error}`;
        console.log(errorMsg);
        await response.complete("fail");
        send("EV_APPLE_PAY_ERROR", errorMsg);
      }
    };

    const buttonElement = button.current;

    if (buttonElement) {
      buttonElement.addEventListener("click", handleClick);
    }

    return () => {
      if (buttonElement) {
        buttonElement.removeEventListener("click", handleClick);
      }
    };
  }, [app, config]);

  if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
    console.log("Apple Pay is not available on this device/browser.");
    return null;
  }

  if (!config.transaction.merchant.applePayIdentifier) {
    throw new Error(
      "Apple Pay Merchant Identifier not found, please set merchant.applePayIdentifier on the transaction"
    );
  }

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
  };

  const buttonStyle: CSSProperties = {
    "--apple-pay-button-width": "100%",
    "--apple-pay-button-height": "100%",
    "--apple-pay-button-border-radius": `${config.borderRadius || 4}px`,
    "--apple-pay-button-padding": config.padding || "4px 4px",
    "--apple-pay-button-box-sizing": "border-box",
    flex: "1",
  } as React.CSSProperties;

  return (
    <div style={containerStyle}>
      <apple-pay-button
        ref={button}
        buttonstyle={config.style}
        type={config.type}
        locale={config.locale}
        style={buttonStyle}
      />
    </div>
  );
}
