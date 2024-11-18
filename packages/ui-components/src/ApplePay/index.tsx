import "./styles.css";
import { CSSProperties, useLayoutEffect, useRef } from "react";
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

declare global {
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

export function ApplePay({ config }: ApplePayProps) {
  const { app } = useSearchParams();
  const button = useRef<HTMLButtonElement>(null);
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

  const handleClick = async () => {
    const session = buildSession(app, config);

    session.oncancel = () => {
      send("EV_APPLE_PAY_CANCELLED");
    };

    session.onpaymentauthorized = async (event) => {
      try {
        const {
          payment: { token },
        } = event;
        const { paymentData } = token;

        const encrypted: EncryptedApplePayData = await exchangeApplePaymentData(
          app,
          paymentData,
          config.transaction.merchant.evervaultId
        );

        // return the EV encrypted data
        send("EV_APPLE_PAY_AUTH", encrypted);

        // wait for response from the host to say the payment was completed
        const result =
          await new Promise<ApplePayJS.ApplePayPaymentAuthorizationResult>(
            (resolve) => {
              on("EV_APPLE_PAY_COMPLETION", () => {
                resolve({
                  status: ApplePaySession.STATUS_SUCCESS,
                });
              });

              on("EV_APPLE_PAY_AUTH_ERROR", (error) => {
                console.error("Error during payment completion:", error);
                resolve({
                  status: ApplePaySession.STATUS_FAILURE,
                });
              });
            }
          );

        session.completePayment(result);
      } catch (error) {
        console.error("Error during payment completion:", error);
        session.completePayment({
          status: ApplePaySession.STATUS_FAILURE,
        });
      }
    };

    session.begin();
  };

  // device does not support Apple Pay
  if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
    return null;
  }

  if (!config.transaction.merchant.applePayIdentifier) {
    throw new Error(
      "Apple Pay Merchant Identifier not found, please set merchant.applePayIdentifier on the transaction"
    );
  }

  const style = {
    "--type": config.type,
    "--style": config.style,
    "--border-radius": config.borderRadius || 4,
    width: "100%",
    height: "100%",
    cursor: "pointer",
  };

  return (
    <button
      ref={button}
      className="apple-pay"
      onClick={handleClick}
      style={style as CSSProperties}
    />
  );
}
