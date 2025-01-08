import { EncryptedGooglePayData } from "types";
import { GooglePayConfig } from "./types";
import { apiConfig } from "../utilities/config";
import { MerchantDetail } from "../utilities/useMerchant";

export function buildPaymentRequest(
  config: GooglePayConfig,
  merchant: MerchantDetail
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
            gatewayMerchantId: merchant.id,
          },
        },
      },
    ],
    merchantInfo: {
      merchantId: apiConfig.googlePayMerchantId,
      merchantName: merchant.name,
      merchantOrigin: window.location.origin, // merchantOrigin is not present in the GooglePayConfig type but is noted as required by the GooglePay API
    } as unknown as google.payments.api.MerchantInfo,
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPriceLabel: `Pay ${merchant.name}`,
      totalPrice: (tx.amount / 100).toFixed(2).toString(),
      currencyCode: tx.currency,
      countryCode: tx.country,
      displayItems: tx.lineItems?.map((item) => ({
        label: item.label,
        type: "LINE_ITEM",
        price: (item.amount / 100).toFixed(2).toString(),
      })),
    },
    callbackIntents: ["PAYMENT_AUTHORIZATION"],
  };
}

const API = import.meta.env.VITE_API_URL as string;

export async function exchangePaymentData(
  app: string,
  paymentData: google.payments.api.PaymentData,
  merchantId: string
): Promise<EncryptedGooglePayData> {
  const token = JSON.parse(
    paymentData.paymentMethodData.tokenizationData.token
  );
  const requestBody = {
    token,
    merchantId,
  };

  const response = await fetch(`${API}/frontend/google-pay/credentials`, {
    method: "POST",
    headers: {
      "x-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  return response.json();
}
