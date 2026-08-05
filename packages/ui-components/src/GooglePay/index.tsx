import css from "./styles.module.css";
import { CSSProperties, useLayoutEffect, useRef } from "react";
import { buildPaymentRequest, exchangePaymentData } from "./utilities";
import { setSize } from "../utilities/resize";
import { GooglePayConfig } from "./types";
import { useMessaging } from "../utilities/useMessaging";
import {
  GooglePayClientMessages,
  GooglePayHostMessages,
  PaymentMethodType,
} from "types";
import { useSearchParams } from "../utilities/useSearchParams";
import { getMerchant } from "../utilities/useMerchant";
import { getAppSDKConfig, markStart, markEndAndReport } from "shared";
import { apiConfig } from "../utilities/config";

const FUNDING_SOURCE_MAP: Partial<
  Record<google.payments.api.CardFundingSource, PaymentMethodType>
> = {
  CREDIT: "credit",
  DEBIT: "debit",
  PREPAID: "prepaid",
};

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
    if (config.transaction.type == "disbursement") {
      console.error("Google Pay does not support disbursment transactions.");
      return;
    }

    if (called.current) return;
    called.current = true;

    markStart("ev:google-pay:mount");

    async function onLoad() {
      markStart("ev:google-pay:get-app-sdk-config");
      const appConfig = await getAppSDKConfig(app, apiConfig.apiUrl);
      markEndAndReport("ev:google-pay:get-app-sdk-config");
      const paymentsClient = new google.payments.api.PaymentsClient({
        // Always use 'test' in staging, but use the resolved environment in production
        environment:
          apiConfig.environment === "staging"
            ? "TEST"
            : appConfig.is_sandbox
            ? "TEST"
            : "PRODUCTION",
        paymentDataCallbacks: {
          onPaymentAuthorized: async (data) => {
            // Mirrors ev:apple-pay:authorize-to-done: this callback fires the
            // moment the user authorizes in the Google Pay sheet (the
            // equivalent of session.show() resolving for Apple Pay), and
            // resolving it is what tells Google the result — so start/end
            // here brackets the same "authorized -> done" work (exchange +
            // host-page round trip), not the sheet's own on-screen time.
            markStart("ev:google-pay:authorize-to-done");

            const payload = await exchangePaymentData(
              app,
              data,
              config.transaction.merchantId
            );

            if (data.email) {
              payload.email = data.email;
            }

            const paymentMethodData = data.paymentMethodData;
            payload.card.displayName = paymentMethodData?.description;

            const paymentMethodInfo = paymentMethodData?.info;

            const paymentMethodType = paymentMethodInfo?.cardFundingSource
              ? FUNDING_SOURCE_MAP[paymentMethodInfo.cardFundingSource]
              : undefined;
            if (paymentMethodType) {
              payload.card.paymentMethodType = paymentMethodType;
            }

            const billingAddress = paymentMethodInfo?.billingAddress || null;
            if (billingAddress) {
              payload.billingAddress = billingAddress;
            }

            const cardDetails = paymentMethodInfo?.cardDetails;
            if (cardDetails) {
              const fourDigitRegex = /(\d{4})$/;
              const lastFour = cardDetails.match(fourDigitRegex);
              if (lastFour) {
                payload.card.lastFour = lastFour[0];
              } else {
                // If the last four digits are not found, try to get them from the description
                const descriptionLastFour =
                  paymentMethodData?.description?.match(fourDigitRegex);
                if (descriptionLastFour) {
                  payload.card.lastFour = descriptionLastFour[0];
                }
              }
            }

            return new Promise((resolve) => {
              on("EV_GOOGLE_PAY_AUTH_COMPLETE", () => {
                send("EV_GOOGLE_PAY_SUCCESS");
                markEndAndReport("ev:google-pay:authorize-to-done");
                resolve({ transactionState: "SUCCESS" });
              });

              on("EV_GOOGLE_PAY_AUTH_ERROR", (error) => {
                const googleError: google.payments.api.PaymentDataError = {
                  reason: error.reason || "OTHER_ERROR",
                  intent: error.intent || "PAYMENT_AUTHORIZATION",
                  message: error.message,
                };
                markEndAndReport("ev:google-pay:authorize-to-done");
                resolve({
                  transactionState: "ERROR",
                  error: googleError,
                });
              });

              send("EV_GOOGLE_PAY_AUTH", payload);
            });
          },
        },
      });

      try {
        markStart("ev:google-pay:get-merchant");
        const merchant = await getMerchant(app, config.transaction.merchantId);
        markEndAndReport("ev:google-pay:get-merchant");
        if (!merchant) {
          throw new Error("Merchant not found");
        }

        const paymentRequest = buildPaymentRequest(config, merchant);
        await paymentsClient.isReadyToPay(paymentRequest);
        const btn = paymentsClient.createButton({
          buttonLocale: config.locale || "en",
          buttonType: config.type || "plain",
          buttonColor: config.color || "black",
          buttonRadius: config.borderRadius || 4,
          buttonSizeMode: "fill",
          onClick: async () => {
            // Mirrors ev:apple-pay:tap-to-sheet — measuring click -> sheet has
            // content, not just click -> sheet requested. Google renders its
            // sheet in a payframe iframe
            // (https://pay.google.com/gp/p/ui/payframe) it injects into this
            // document. That frame is a different origin, so we can't see
            // what's rendered inside it, but we can watch for it being added
            // and listen for its own load event — the closest signal
            // available to us for "sheet has content" (confirmed via manual
            // testing: this is a real injected iframe, not a native
            // browser-chrome sheet we'd have no DOM visibility into at all).
            markStart("ev:google-pay:tap-to-sheet");

            let tapToSheetSettled = false;
            const endTapToSheet = () => {
              if (tapToSheetSettled) return;
              tapToSheetSettled = true;
              markEndAndReport("ev:google-pay:tap-to-sheet");
            };

            const frameObserver = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                  if (
                    node instanceof HTMLIFrameElement &&
                    node.src.startsWith(
                      "https://pay.google.com/gp/p/ui/payframe"
                    )
                  ) {
                    node.addEventListener("load", endTapToSheet, {
                      once: true,
                    });
                    frameObserver.disconnect();
                    return;
                  }
                }
              }
            });
            frameObserver.observe(document.body, {
              childList: true,
              subtree: true,
            });

            try {
              await paymentsClient.loadPaymentData(paymentRequest);
            } catch (err) {
              if (isPaymentError(err) && err.statusCode === "CANCELED") {
                send("EV_GOOGLE_PAY_CANCELLED");
              } else {
                const errorMsg = `Something went wrong, please try again: ${err}`;
                send("EV_GOOGLE_PAY_ERROR", errorMsg);
              }
            } finally {
              // Fallback: if the payframe never appeared (e.g. Google
              // rejected before rendering anything) or the flow settled
              // before its load event fired, still close out the mark
              // rather than leaving a dangling start with no end.
              frameObserver.disconnect();
              endTapToSheet();
            }
          },
        });

        if (container.current) {
          container.current.appendChild(btn);
          markEndAndReport("ev:google-pay:mount");

          setSize({
            width: container.current.offsetWidth,
            height: container.current.offsetHeight,
          });

          const gpayButton = btn.querySelector("button");
          if (gpayButton) {
            const minSize: { minWidth?: number; minHeight?: number } = {};
            const computedStyle = getComputedStyle(gpayButton);
            if (computedStyle.minWidth) {
              const minWidth = Number.parseFloat(computedStyle.minWidth);
              if (!Number.isNaN(minWidth)) {
                minSize.minWidth = minWidth;
              }
            }
            if (computedStyle.minHeight) {
              const minHeight = Number.parseFloat(computedStyle.minHeight);
              if (!Number.isNaN(minHeight)) {
                minSize.minHeight = minHeight;
              }
            }
            setSize({
              height: container.current.offsetHeight,
              ...minSize,
            });
          }
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
