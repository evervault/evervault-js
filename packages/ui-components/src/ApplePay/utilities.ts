import { TransactionDetails } from "types";

export function buildPaymentRequest(tx: TransactionDetails) {
  const request = {
    countryCode: tx.country,
    currencyCode: tx.currency,
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: ["visa", "masterCard", "amex", "discover"],
    total: {
      label: "Demo (Card is not charged)",
      type: "final",
      amount: "1.99",
    },
  };

  const session = new ApplePaySession(3, request);

  session.onmerchantvalidation = (event) => {
    const response = fetch(
      "https://api-donaltuohy.ngrok.app/frontend/apple-pay/merchant-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Evervault-App-Id": "app_8f3dc605aa5d",
        },
        body: JSON.stringify({
          merchantUuid: "merchant_8f3dc605aa5d",
          domain: "donaltuohy.ngrok.app",
        }),
      }
    );

    const { sessionData } = response.json();
    event.completeMerchantValidation(sessionData);
  };

  return session;
}
