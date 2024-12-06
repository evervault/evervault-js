import {
  ApplePayToken,
  EncryptedApplePayData,
  TransactionDetails,
} from "types";
import { ApplePayConfig, ValidateMerchantResponse } from "./types";

const API = import.meta.env.VITE_API_URL as string;

export function buildSession(app: string, config: ApplePayConfig) {
  const { transaction: tx, paymentRequest } = config;

  const lineItems =
    (tx.lineItems?.map((item) => ({
      label: item.label,
      type: "final",
      amount: (item.amount / 100).toFixed(2).toString(),
    })) as ApplePayJS.ApplePayLineItem[]) || [];

  const request: ApplePayJS.ApplePayPaymentRequest = {
    countryCode: tx.country,
    currencyCode: tx.currency,
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: config.allowedCardNetworks?.map((network) =>
      network.toLowerCase()
    ) || ["visa", "masterCard", "amex", "discover"],
    total: {
      label: `${tx.merchant.name}`,
      type: "final",
      amount: (tx.amount / 100).toFixed(2).toString(),
    },
    lineItems,
    ...paymentRequest,
  };

  const session = new ApplePaySession(3, request);

  session.onvalidatemerchant = async () => {
    const { sessionData } = await validateMerchant(app, tx);
    session.completeMerchantValidation(sessionData);
  };

  return session;
}

async function validateMerchant(
  app: string,
  tx: TransactionDetails
): Promise<ValidateMerchantResponse> {
  const response = await fetch(`${API}/frontend/apple-pay/merchant-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
    body: JSON.stringify({
      merchantUuid: tx.merchant.id,
      domain: tx.merchant.applePayIdentifier,
    }),
  });

  return response.json();
}

export async function exchangeApplePaymentData(
  app: string,
  token: ApplePayToken,
  merchantId: string
): Promise<EncryptedApplePayData> {
  const requestBody = {
    merchantId,
    encryptedCredentials: token,
  };

  const response = await fetch(`${API}/frontend/apple-pay/credentials`, {
    method: "POST",
    headers: {
      "x-Evervault-App-Id": app,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  return response.json();
}
