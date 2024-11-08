import css from "./styles.module.css";
import { useLayoutEffect, useRef } from "react";
import { buildPaymentRequest, exchangePaymentData } from "./utilities";
import { setSize } from "../utilities/resize";
import { GooglePayConfig } from "./types";
import { useMessaging } from "../utilities/useMessaging";
import { GooglePayClientMessages, GooglePayHostMessages } from "types";
import { useSearchParams } from "../utilities/useSearchParams";

interface GooglePayProps {
  config: GooglePayConfig;
}

function isPaymentError(
  err: unknown
): err is google.payments.api.PaymentsError {
  return Boolean((err as google.payments.api.PaymentsError).statusCode);
}

export function GooglePay({ config }: GooglePayProps) {
  const { app } = useSearchParams();
  const container = useRef<HTMLDivElement>(null);
  const called = useRef(false);
  const { send } = useMessaging<
    GooglePayHostMessages,
    GooglePayClientMessages
  >();

  useLayoutEffect(() => {
    if (called.current) return;
    called.current = true;

    async function onLoad() {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: config.environment,
        paymentDataCallbacks: {
          onPaymentAuthorized: async (data) => {
            try {
              const encrypted = await exchangePaymentData(app, data);
              send("EV_GOOGLE_PAY_AUTH", encrypted);
              return { transactionState: "SUCCESS" };
            } catch {
              return {
                // TODO: allow user to return specific error messages
                transactionState: "ERROR",
                error: {
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
        const paymentRequest = buildPaymentRequest(config);
        await paymentsClient.isReadyToPay(paymentRequest);
        const btn = paymentsClient.createButton({
          buttonType: config.type || "plain",
          buttonColor: config.color || "black",
          buttonRadius: config.borderRadius || 4,
          buttonSizeMode: "fill",
          onClick: async () => {
            try {
              await paymentsClient.loadPaymentData(paymentRequest);
            } catch (err) {
              if (isPaymentError(err) && err.statusCode === "CANCELED") {
                send("EV_GOOGLE_CANCELLED");
              } else {
                console.error(err);
                // TODO: Fire an error event
              }
            }
          },
        });

        container.current?.appendChild(btn);

        if (container.current) {
          setSize({
            width: container.current.offsetWidth,
            height: container.current.offsetHeight,
          });
        }
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
  }, [app, config, send]);

  return <div className={css.googlePay} ref={container} />;
}
