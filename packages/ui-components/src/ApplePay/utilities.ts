import {
  ApplePayToken,
  DisbursementTransactionDetails,
  EncryptedApplePayData,
  MerchantDetail,
  PaymentTransactionDetails,
  TransactionDetailsWithDomain,
} from "types";
import { ApplePayConfig, DisbursementContactAddress, DisbursementContactDetails, ValidateMerchantResponse } from "./types";

const API = import.meta.env.VITE_API_URL as string;

export function buildSession(
  app: string,
  merchant: MerchantDetail,
  config: ApplePayConfig
) {
  const { transaction: tx } = config;

  let baseRequest;
  if (tx.type === "payment") {
    baseRequest = buildPaymentSession(merchant, config, tx);
  } else {
    baseRequest = buildDisbursementSession(merchant, config, tx);
  }

  // @ts-expect-error - onmerchantvalidation is added by apple and not on the PaymentRequest type
  baseRequest.onmerchantvalidation = async (event) => {
    const merchantSessionPromise = await validateMerchant(
      app,
      event.validationURL,
      tx
    );
    event.complete(merchantSessionPromise.sessionData);
  };

  return baseRequest;
}

function buildPaymentSession(
  merchant: MerchantDetail,
  config: ApplePayConfig,
  tx: PaymentTransactionDetails
) {
  const lineItems =
    tx.lineItems?.map((item) => ({
      label: item.label,
      amount: {
        value: (item.amount / 100).toFixed(2).toString(),
        currency: tx.currency,
      },
    })) || [];

  const paymentMethodData: PaymentMethodData[] = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: `merchant.com.evervault.${merchant.id}`,
        merchantCapabilities: ["supports3DS"],
        supportedNetworks: config.allowedCardNetworks?.map((network) =>
          network.toLowerCase()
        ) || ["visa", "masterCard", "amex", "discover"],
        countryCode: tx.country,
      },
    },
  ];

  const paymentDetails: PaymentDetailsInit = {
    total: {
      label: `${merchant.name}`,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
  };

  const paymentOptions = {
    requestPayerName: false,
    requestBillingAddress: false,
    requestPayerEmail: false,
    requestPayerPhone: false,
    requestShipping: false,
    shippingType: "shipping",
  };

  const paymentOverrides = config.paymentOverrides || {};

  const request = new PaymentRequest(
    paymentOverrides.paymentMethodData
      ? paymentOverrides.paymentMethodData
      : paymentMethodData,
    paymentOverrides.paymentDetails
      ? paymentOverrides.paymentDetails
      : paymentDetails,
    // @ts-expect-error - apple overrides the payment request
    paymentOptions
  );

  return request;
}

function buildDisbursementSession(
  merchant: MerchantDetail,
  config: ApplePayConfig,
  tx: DisbursementTransactionDetails
) {
  const lineItems =
    tx.lineItems?.map((item) => ({
      label: item.label,
      amount: {
        value: (item.amount / 100).toFixed(2).toString(),
        currency: tx.currency,
      },
    })) || [];

  const merchantCapabilities = ["supports3DS"];

  if (tx.instantTransfer) {
    merchantCapabilities.push("supportsInstantFundsOut");
  }

  const paymentMethodData = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: `merchant.com.evervault.${merchant.id}`,
        merchantCapabilities,
        supportedNetworks: config.allowedCardNetworks,
        countryCode: tx.country,
      },
    },
  ];

  let calculatedTotal = tx.amount;

  if (tx.instantTransfer) {
    calculatedTotal = tx.amount - tx.instantTransfer.amount;
  }

  const paymentDetails = {
    total: {
      label: merchant.name,
      amount: {
        value: calculatedTotal.toString(),
        currency: tx.currency,
      },
    },
    modifiers: [
      {
        supportedMethods: "https://apple.com/apple-pay",
        data: {
          disbursementRequest: tx.requiredRecipientDetails
            ? {
                requiredRecipientContactFields: tx.requiredRecipientDetails.map((field) => {
                  if (field === "address") { 
                    return "postalAddress" 
                  } else return field;
                }),
              }
            : {},
          // ORDER OF THESE IS IMPORTANT - IT BREAKS IF NOT IN THIS ORDER
          additionalLineItems: [
            {
              label: "Total Amount",
              amount: tx.amount,
            },
            ...(lineItems ? lineItems : []),
            ...(tx.instantTransfer
              ? [
                  {
                    label: tx.instantTransfer.label,
                    amount: tx.instantTransfer.amount,
                    disbursementLineItemType: "instantFundsOutFee",
                  },
                ]
              : []),
            {
              label: "Apple Pay Demo",
              amount: calculatedTotal,
              disbursementLineItemType: "disbursement",
            },
          ],
        },
      },
    ],
  };

  const paymentOptions = {};

  const request = new PaymentRequest(
    paymentMethodData,
    paymentDetails,
    // @ts-expect-error - apple overrides the payment request
    paymentOptions
  );

  return request;
}

export function buildAddressObject(billingContact: DisbursementContactDetails): DisbursementContactAddress {
  return {
    addressLines: billingContact.addressLines,
    administrativeArea: billingContact.administrativeArea,
    country: billingContact.country,
    countryCode: billingContact.countryCode,
    locality: billingContact.locality,
    postalCode: billingContact.postalCode,
    subAdministrativeArea: billingContact.subAdministrativeArea,
    subLocality: billingContact.subLocality,
  };
}

async function validateMerchant(
  app: string,
  validationUrl: string,
  tx: TransactionDetailsWithDomain
): Promise<ValidateMerchantResponse> {
  const response = await fetch(`${API}/frontend/apple-pay/merchant-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
    body: JSON.stringify({
      validationUrl: validationUrl,
      merchantUuid: tx.merchantId,
      domain: tx.domain,
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
