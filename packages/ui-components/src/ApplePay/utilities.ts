import { TransactionDetails } from "types";
import { ValidateMerchantResponse } from "./types";

const API = import.meta.env.VITE_API_URL as string;

export function buildSession(app: string, tx: TransactionDetails) {
  const request: ApplePayJS.ApplePayPaymentRequest = {
    countryCode: tx.country,
    currencyCode: tx.currency,
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: ["visa", "masterCard", "amex", "discover"],
    total: {
      label: "Total",
      type: "final",
      amount: (tx.amount / 100).toFixed(2).toString(),
    },
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
      merchantUuid: tx.merchant.evervaultId,
      domain: tx.merchant.applePayIdentifier,
    }),
  });

  return response.json();
}
