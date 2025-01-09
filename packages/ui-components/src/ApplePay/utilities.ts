import {
  ApplePayToken,
  EncryptedApplePayData,
  MerchantDetail,
  TransactionDetails,
} from "types";
import { ApplePayConfig, ValidateMerchantResponse } from "./types";

const API = import.meta.env.VITE_API_URL as string;

export function buildSession(
  app: string,
  merchant: MerchantDetail,
  config: ApplePayConfig
) {
  const { transaction: tx } = config;

  const lineItems =
    tx.lineItems?.map((item) => ({
      label: item.label,
      amount: {
        value: (item.amount / 100).toFixed(2).toString(),
        currency: tx.currency,
      },
    })) || [];

  const paymentMethodsDataOverrides = {};

  const paymentMethodData: PaymentMethodData[] = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: `merchant.com.evervault.${tx.merchant.id}`,
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: config.allowedCardNetworks?.map((network) =>
          network.toLowerCase()
        ) || ["visa", "masterCard", "amex", "discover"],
        countryCode: tx.country,
        ...paymentMethodsDataOverrides,
      },
    },
  ];

  const paymentDetails: PaymentDetailsInit = {
    total: {
      label: `${merchant.name}`,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
    modifiers: config.paymentDetailsModifiers,
  };

  // not supported in v1 - default to false for now
  const paymentOptions = {
    requestPayerName: false,
    requestBillingAddress: false,
    requestPayerEmail: false,
    requestPayerPhone: false,
    requestShipping: false,
    shippingType: "shipping",
  };

  const request = new PaymentRequest(
    paymentMethodData,
    paymentDetails,
    // @ts-expect-error - apple overrides the payment request
    paymentOptions
  );

  // @ts-expect-error - onmerchantvalidation is added by apple and not on the PaymentRequest type
  request.onmerchantvalidation = async (event) => {
    const merchantSessionPromise = await validateMerchant(app, tx);
    console.log(merchantSessionPromise);
    event.complete(merchantSessionPromise.sessionData);
  };

  return request;
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
      merchantUuid: tx.merchantId,
      domain: window.location.origin,
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
