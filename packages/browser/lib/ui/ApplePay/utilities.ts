import {
  DisbursementTransactionDetails,
  MerchantDetail,
  PaymentTransactionDetails,
  TransactionDetailsWithDomain,
} from "types";
import {
  DisbursementContactAddress,
  DisbursementContactDetails,
  ValidateMerchantResponse,
  ApplePayCardNetwork,
  ApplePayPaymentRequest,
} from "./types";
import ApplePayButton from ".";

type BuildSessionOptions = {
  transaction: TransactionDetailsWithDomain;
  allowedCardNetworks?: ApplePayCardNetwork[];
  requestPayerDetails?: ("name" | "email" | "phone")[];
  requestBillingAddress?: boolean;
  requestShipping?: boolean;
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
};

export async function buildSession(
  applePay: ApplePayButton,
  config: BuildSessionOptions
) {
  const { transaction: tx } = config;

  const merchant = await getMerchant(applePay, tx.merchantId);

  let baseRequest: ApplePayPaymentRequest;
  if (tx.type === "payment") {
    baseRequest = buildPaymentSession(merchant, config, tx);
  } else {
    baseRequest = buildDisbursementSession(merchant, config, tx);
  }

  baseRequest.onmerchantvalidation = async (event) => {
    const merchantSessionPromise = await validateMerchant(
      applePay,
      event.validationURL,
      tx
    );
    event.complete(merchantSessionPromise.sessionData);
  };

  // Apple pay requires subscribing to onshippingaddresschange and calling updateWith
  // in order to receive shipping data. In future we should allow users to hook into
  // this event to modify the payment request based on the shipping address.
  baseRequest.onshippingaddresschange = (event: PaymentRequestUpdateEvent) => {
    const update: PaymentDetailsUpdate = {};
    event.updateWith(update);
  };

  return baseRequest;
}

function buildPaymentSession(
  merchant: MerchantDetail,
  config: BuildSessionOptions,
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
        merchantIdentifier: `merchant.com.evervault.${config.transaction.merchantId}`,
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
      label: merchant.name,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
  };

  const paymentOptions = {
    requestPayerName: config.requestPayerDetails?.includes("name") ?? false,
    requestBillingAddress: config.requestBillingAddress ?? false,
    requestPayerEmail: config.requestPayerDetails?.includes("email") ?? false,
    requestPayerPhone: config.requestPayerDetails?.includes("phone") ?? false,
    requestShipping: config.requestShipping ?? false,
    shippingType: "shipping",
  };

  const paymentOverrides = config.paymentOverrides || {};

  const request = new PaymentRequest(
    paymentOverrides.paymentMethodData || paymentMethodData,
    paymentOverrides.paymentDetails || paymentDetails,
    // @ts-expect-error - apple overrides the payment request
    paymentOptions
  );

  return request;
}

function buildDisbursementSession(
  merchant: MerchantDetail,
  config: BuildSessionOptions,
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
        merchantIdentifier: `merchant.com.evervault.${config.transaction.merchantId}`,
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
                requiredRecipientContactFields: tx.requiredRecipientDetails.map(
                  (field) => {
                    if (field === "address") {
                      return "postalAddress";
                    } else return field;
                  }
                ),
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
  const disbursementOverrides = config.disbursementOverrides || {};

  const request = new PaymentRequest(
    paymentMethodData,
    disbursementOverrides.disbursementDetails || paymentDetails,
    // @ts-expect-error - apple overrides the payment request
    paymentOptions
  );

  return request;
}

export function buildAddressObject(
  billingContact: DisbursementContactDetails
): DisbursementContactAddress {
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
  applePay: ApplePayButton,
  validationUrl: string,
  tx: TransactionDetailsWithDomain
): Promise<ValidateMerchantResponse> {
  const app = applePay.client.config.appId;
  const apiURL = applePay.client.config.http.apiUrl;

  const response = await fetch(
    `${apiURL}/frontend/apple-pay/merchant-session`,
    {
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
    }
  );

  return response.json();
}

async function getMerchant(applePay: ApplePayButton, id: string) {
  const app = applePay.client.config.appId;
  const apiURL = applePay.client.config.http.apiUrl;
  const response = await fetch(`${apiURL}/frontend/merchants/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Evervault-App-Id": app,
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch merchant details for ${id}`,
      response.status
    );
    return undefined;
  }

  return response.json();
}
