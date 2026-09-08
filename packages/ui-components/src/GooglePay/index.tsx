import css from "./styles.module.css";
import { CSSProperties, useLayoutEffect, useRef } from "react";
import {
  buildPaymentRequest,
  buildTransactionInfo,
  exchangePaymentData,
  shippingOptionParameters,
} from "./utilities";
import { setSize } from "../utilities/resize";
import { GooglePayConfig } from "./types";
import { useMessaging } from "../utilities/useMessaging";
import {
  GooglePayClientMessages,
  GooglePayDataChangeResponse,
  GooglePayHostMessages,
  PaymentMethodType,
} from "types";
import { useSearchParams } from "../utilities/useSearchParams";
import { getMerchant } from "../utilities/useMerchant";
import { getAppSDKConfig } from "shared";
import { apiConfig } from "../utilities/config";

// Google's own default when buttonRadius is unset. The Android SDK uses the same
// value, so a merchant who sets nothing gets the same button on both platforms.
const DEFAULT_BUTTON_RADIUS = 12;

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

/**
 * `CallbackTrigger` and `CallbackIntent` overlap but are not the same union, so
 * an error raised from a data change has to name an intent Google accepts.
 */
function defaultShippingError(
  data: google.payments.api.IntermediatePaymentData
): Pick<google.payments.api.PaymentDataError, "reason" | "intent"> {
  return data.callbackTrigger === "SHIPPING_OPTION"
    ? { reason: "SHIPPING_OPTION_INVALID", intent: "SHIPPING_OPTION" }
    : {
        reason: "SHIPPING_ADDRESS_UNSERVICEABLE",
        intent: "SHIPPING_ADDRESS",
      };
}

let dataChangeSequence = 0;

function initialShippingOptionId(
  shippingOptions: GooglePayConfig["shippingOptions"]
): string | null {
  return (
    shippingOptions?.defaultSelectedOptionId ??
    shippingOptions?.options[0]?.id ??
    null
  );
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

    async function onLoad() {
      const appConfigPromise = getAppSDKConfig(app, apiConfig.apiUrl);
      const merchantPromise = getMerchant(app, config.transaction.merchantId);

      const appConfig = await appConfigPromise;
      // Each response patches the open sheet. Keep prior values when a later
      // merchant response updates only the amount or only the line items.
      let currentAmount = config.transaction.amount;
      let currentLineItems = config.transaction.lineItems;
      let currentShippingOptions = config.shippingOptions;
      let currentShippingAddress: google.payments.api.IntermediateAddress | null =
        null;
      let currentShippingOptionId = initialShippingOptionId(
        config.shippingOptions
      );

      const paymentsClient = new google.payments.api.PaymentsClient({
        // Always use 'test' in staging, but use the resolved environment in production
        environment:
          apiConfig.environment === "staging"
            ? "TEST"
            : appConfig.is_sandbox
            ? "TEST"
            : "PRODUCTION",
        paymentDataCallbacks: {
          // Google raises this while the sheet is open, and can raise it more
          // than once per session, so each request is matched to its reply by
          // id rather than by message type alone.
          onPaymentDataChanged: async (data) => {
            const id = `gpay-data-change-${++dataChangeSequence}`;

            if (data.shippingAddress !== undefined) {
              currentShippingAddress = data.shippingAddress;
            }
            if (data.shippingOptionData?.id) {
              currentShippingOptionId = data.shippingOptionData.id;
            }

            const currentShippingOption =
              currentShippingOptions?.options.find(
                (option) => option.id === currentShippingOptionId
              ) ?? null;

            const update = await new Promise<GooglePayDataChangeResponse>(
              (resolve) => {
                const off = on(
                  "EV_GOOGLE_PAY_DATA_CHANGE_RESULT",
                  (response) => {
                    if (response.id !== id) return;
                    off();
                    resolve(response);
                  }
                );

                send("EV_GOOGLE_PAY_DATA_CHANGE", {
                  id,
                  trigger: data.callbackTrigger,
                  shippingAddress: currentShippingAddress,
                  selectedShippingOption: currentShippingOption,
                  amount: currentAmount,
                  lineItems: currentLineItems,
                  shippingOptions: currentShippingOptions,
                });
              }
            );

            if (update.error) {
              const defaultError = defaultShippingError(data);
              return {
                error: {
                  reason: update.error.reason ?? defaultError.reason,
                  intent: update.error.intent ?? defaultError.intent,
                  message: update.error.message,
                },
              };
            }

            const result: google.payments.api.PaymentDataRequestUpdate = {};

            if (update.amount !== undefined || update.lineItems !== undefined) {
              currentAmount = update.amount ?? currentAmount;
              currentLineItems = update.lineItems ?? currentLineItems;

              const merchant = await merchantPromise;
              result.newTransactionInfo = buildTransactionInfo(
                config,
                merchant?.name ?? "",
                { amount: currentAmount, lineItems: currentLineItems }
              );
            }

            if (update.shippingOptions) {
              currentShippingOptions = update.shippingOptions;
              currentShippingOptionId = initialShippingOptionId(
                currentShippingOptions
              );
              result.newShippingOptionParameters = shippingOptionParameters(
                currentShippingOptions
              );
            }

            return result;
          },
          onPaymentAuthorized: async (data) => {
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

            if (data.shippingAddress) {
              payload.shippingAddress = data.shippingAddress;
            }

            if (data.shippingOptionData) {
              payload.shippingOption = currentShippingOptions?.options.find(
                (option) => option.id === data.shippingOptionData?.id
              );
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

              send("EV_GOOGLE_PAY_AUTH", payload);
            });
          },
        },
      });

      try {
        const merchant = await merchantPromise;
        if (!merchant) {
          throw new Error("Merchant not found");
        }

        const paymentRequest = buildPaymentRequest(config, merchant);
        await paymentsClient.isReadyToPay(paymentRequest);
        const btn = paymentsClient.createButton({
          buttonLocale: config.locale || "en",
          buttonType: config.type || "plain",
          buttonColor: config.color || "black",
          buttonRadius: config.borderRadius ?? DEFAULT_BUTTON_RADIUS,
          buttonSizeMode: "fill",
          onClick: async () => {
            currentAmount = config.transaction.amount;
            currentLineItems = config.transaction.lineItems;
            currentShippingOptions = config.shippingOptions;
            currentShippingAddress = null;
            currentShippingOptionId = initialShippingOptionId(
              config.shippingOptions
            );

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

        if (container.current) {
          container.current.appendChild(btn);

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
