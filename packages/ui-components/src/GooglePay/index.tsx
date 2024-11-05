import css from "./styles.module.css";
import { useLayoutEffect, useRef } from "react";
import { buildPaymentRequest, exchangePaymentData } from "./utilities";
import { resize } from "../utilities/resize";
import { GooglePayConfig } from "./types";
import { useMessaging } from "../utilities/useMessaging";
import { GooglePayClientMessages, GooglePayHostMessages } from "types";
import { useSearchParams } from "../utilities/useSearchParams";

declare global {
  interface Window {
    google: any;
  }
}

interface GooglePayProps {
  config: GooglePayConfig;
}

function isPaymentError(err: any): err is google.payments.api.PaymentsError {
  return err.hasOwnProperty("statusCode");
}

export function GooglePay({ config }: GooglePayProps) {
  const { app } = useSearchParams();
  const container = useRef<HTMLDivElement>(null);
  const called = useRef(false);
  const { send, on } = useMessaging<
    GooglePayHostMessages,
    GooglePayClientMessages
  >();

  useLayoutEffect(() => {
    if (called.current) return;
    called.current = true;

    async function onLoad() {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: "TEST", // TODO: remove TEST environment
        paymentDataCallbacks: {
          onPaymentAuthorized: async (data) => {
            // TODO: exchange data for encrypted payload via frontend API
            try {
              const encrypted = await exchangePaymentData(app, data);

              await new Promise((resolve) => {
                // The parent frame will send a message to the child frame when processing is done
                on("EV_GOOGLE_PAY_AUTH_COMPLETE", resolve);
                // Send the data up to the parent frame to process
                send("EV_GOOGLE_PAY_AUTH", encrypted);
              });

              return { transactionState: "SUCCESS" };
            } catch (err) {
              return {
                transactionState: "ERROR",
                error: {
                  // TODO: allow user to return specific error messages
                  intent: "PAYMENT_AUTHORIZATION",
                  message: "Insufficient funds",
                  reason: "PAYMENT_DATA_INVALID",
                },
              };
            }
          },
        },
      });

      try {
        const paymentRequest = buildPaymentRequest(config.transaction);
        await paymentsClient.isReadyToPay(paymentRequest);
        const btn = paymentsClient.createButton({
          // TODO: Support more button config options. https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions
          buttonType: config.type || "plain",
          buttonColor: config.color || "black",
          buttonRadius: config.borderRadius || 4,
          onClick: async () => {
            try {
              await paymentsClient.loadPaymentData(paymentRequest);
              // TODO: Fire a success event
            } catch (err) {
              if (isPaymentError(err) && err.statusCode === "CANCELED") {
                // TODO: Fire a cancelled event
              } else {
                // TODO: Fire an error event
              }
            }
          },
        });

        container.current?.appendChild(btn);
        // TODO: resize width as well.
        resize();
      } catch (err) {
        console.log("cancelled");
        console.error(err);
      }
    }

    const script = document.createElement("script");
    script.src = "https://pay.google.com/gp/p/js/pay.js";
    script.async = true;
    script.onload = onLoad;
    document.body.appendChild(script);
  }, []);

  return <div className={css.googlePay} ref={container} />;
}
