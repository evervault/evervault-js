import { EncryptedGooglePayData } from "types";
import { GooglePayConfig } from "./types";

export function buildPaymentRequest(
  config: GooglePayConfig
): google.payments.api.PaymentDataRequest {
  const tx = config.transaction;

  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods:
            (config.allowedAuthMethods as google.payments.api.CardAuthMethod[]) || [
              "PAN_ONLY",
              "CRYPTOGRAM_3DS",
            ],
          allowedCardNetworks:
            (config.allowedCardNetworks as google.payments.api.CardNetwork[]) || [
              "AMEX",
              "DISCOVER",
              "INTERAC",
              "JCB",
              "MASTERCARD",
              "VISA",
            ],
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "evervault",
            gatewayMerchantId:
              import.meta.env.VITE_STAGING === "true" ? "googletest" : "google",
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: tx.merchant.id,
      merchantName: tx.merchant.name,
    },
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPriceLabel: "Total",
      totalPrice: (tx.amount / 100).toFixed(2).toString(),
      currencyCode: tx.currency,
      countryCode: tx.country,
    },
    callbackIntents: ["PAYMENT_AUTHORIZATION"],
  };
}

const API = import.meta.env.VITE_API_URL as string;

export async function exchangePaymentData(
  app: string,
  paymentData: google.payments.api.PaymentData
): Promise<EncryptedGooglePayData> {
  const response = await fetch(`${API}/frontend/google-pay/credentials`, {
    method: "POST",
    headers: {
      "x-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
    body: paymentData.paymentMethodData.tokenizationData.token,
  });

  return response.json();
}
