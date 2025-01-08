import css from "./styles.module.css";
import { CSSProperties, useLayoutEffect, useRef } from "react";
import { buildPaymentRequest, exchangePaymentData } from "./utilities";
import { setSize } from "../utilities/resize";
import { GooglePayConfig } from "./types";
import { useMessaging } from "../utilities/useMessaging";
import { GooglePayClientMessages, GooglePayHostMessages } from "types";
import { useSearchParams } from "../utilities/useSearchParams";
import { apiConfig } from "../utilities/config";
import { getMerchant } from "../utilities/useMerchant";

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
  const { send, on } = useMessaging<
    GooglePayHostMessages,
    GooglePayClientMessages
  >();

  useLayoutEffect(() => {
    if (called.current) return;
    called.current = true;

    async function onLoad() {
      const paymentsClient = new google.payments.api.PaymentsClient({
        environment: apiConfig.googlePayEnvironment,
        paymentDataCallbacks: {
          onPaymentAuthorized: async (data) => {
            const encrypted = await exchangePaymentData(
              app,
              data,
              config.transaction.merchantId
            );
            return new Promise((resolve) => {
              on("EV_GOOGLE_PAY_AUTH_COMPLETE", () => {
                send("EV_GOOGLE_PAY_SUCCESS");
                resolve({ transactionState: "SUCCESS" });
              });

              on("EV_GOOGLE_PAY_AUTH_ERROR", (error) => {
                const googleError: google.payments.api.PaymentDataError = {
                  reason: error.reason || "OTHER_ERROR",
                  intent: error.intent || "PAYMENT_AUTHORIZATION",
                  message: error.message,
                };
                resolve({
                  transactionState: "ERROR",
                  error: googleError,
                });
              });
              send("EV_GOOGLE_PAY_AUTH", encrypted);
            });
          },
        },
      });

      try {
        const merchant = await getMerchant(app, config.transaction.merchantId);
        if (!merchant) {
          throw new Error("Merchant not found");
        }

        const paymentRequest = buildPaymentRequest(config, merchant);
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
                send("EV_GOOGLE_PAY_CANCELLED");
              } else {
                const errorMsg = `Something went wrong, please try again: ${err}`;
                send("EV_GOOGLE_PAY_ERROR", errorMsg);
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
  }, [app, config, send, on]);

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100vw",
    height: "100vh",
    display: "flex",
  };

  return (
    <div style={containerStyle}>
      <div className={css.googlePay} ref={container} />
    </div>
  );
}
