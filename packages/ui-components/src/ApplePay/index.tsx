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
      'apple-pay-button': React.DetailedHTMLProps<ApplePayButtonAttributes, HTMLElement>;
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

        send("EV_APPLE_PAY_AUTH", encrypted);

        const result =
          await new Promise<ApplePayJS.ApplePayPaymentAuthorizationResult>(
            (resolve) => {
              on("EV_APPLE_PAY_COMPLETION", () => {
                resolve({
                  status: ApplePaySession.STATUS_SUCCESS,
                });
              });

              on("EV_APPLE_PAY_AUTH_ERROR", (error) => {
                if (error.code && error.contactField) {
                  resolve({
                    status: ApplePaySession.STATUS_FAILURE,
                    errors: [
                      {
                        code: error.code,
                        contactField: error.contactField,
                        message: error.message,
                      },
                    ],
                  });
                } else {
                  resolve({
                    status: ApplePaySession.STATUS_FAILURE,
                  });
                }
                const errorMsg = `Error during payment completion: ${error.message}`;
                send("EV_APPLE_PAY_ERROR", errorMsg);
              });
            }
          );

        session.completePayment(result);
      } catch (error) {
        const errorMsg = `Error during payment completion. Error: ${error}`;
        session.completePayment({
          status: ApplePaySession.STATUS_FAILURE,
        });
        send("EV_APPLE_PAY_ERROR", errorMsg);
      }
    };

    session.begin();
  };

  useEffect(() => {
    const buttonElement = button.current;

    if (buttonElement) {
      buttonElement.addEventListener('click', handleClick);
    }

    return () => {
      if (buttonElement) {
        buttonElement.removeEventListener('click', handleClick);
      }
    };
  }, []);

  if (!window.ApplePaySession || !window.ApplePaySession.canMakePayments()) {
    return null;
  }

  if (!config.transaction.merchant.applePayIdentifier) {
    throw new Error(
      "Apple Pay Merchant Identifier not found, please set merchant.applePayIdentifier on the transaction"
    );
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    display: 'flex'
  };
  
  const buttonStyle: CSSProperties = {
    '--apple-pay-button-width': '100%',
    '--apple-pay-button-height': '100%',
    '--apple-pay-button-border-radius': `${config.borderRadius}px`|| '4px',
    '--apple-pay-button-padding': config.padding || '4px 4px',
    '--apple-pay-button-box-sizing': 'border-box',
    flex: '1',
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