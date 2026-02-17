import {
  DisbursementTransactionDetails,
  MerchantDetail,
  PaymentTransactionDetails,
  RecurringTransactionDetails,
  TransactionDetailsWithDomain,
  TransactionLineItem,
} from "types";
import {
  DisbursementContactAddress,
  DisbursementContactDetails,
  ValidateMerchantResponse,
  ApplePayCardNetwork,
  ApplePayPaymentRequest,
  ShippingAddress,
  PaymentMethodUpdate,
} from "./types";
import ApplePayButton from ".";
import { RecurringPaymentIntervalUnit } from "types/uiComponents";

type BuildSessionOptions = {
  transaction: TransactionDetailsWithDomain;
  allowedCardNetworks?: ApplePayCardNetwork[];
  requestPayerDetails?: ("name" | "email" | "phone" | "postalAddress")[];
  requestBillingAddress?: boolean;
  requestShipping?: boolean;
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
  onPaymentMethodChange?: (
    newPaymentMethod: PaymentMethodUpdate
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  onShippingAddressChange?: (
    newAddress: ShippingAddress
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  prepareTransaction?: () => Promise<{
    amount?: number;
    lineItems?: TransactionLineItem[];
  }>;
};

export async function buildSession(
  applePay: ApplePayButton,
  config: BuildSessionOptions
) {
  const { transaction: tx } = config;

  const merchant = await getMerchant(applePay, tx.merchantId);
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  let baseRequest: ApplePayPaymentRequest;
  if (tx.type === "payment") {
    baseRequest = buildPaymentSession(merchant, config, tx);
  } else if (tx.type === "recurring") {
    baseRequest = buildRecurringSession(merchant, config, tx);
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
  // in order to receive shipping data.
  baseRequest.onshippingaddresschange = (event: PaymentRequestUpdateEvent) => {
    const target = event.target as unknown as {
      shippingAddress?: ShippingAddress;
    };
    if (!target.shippingAddress) {
      return;
    }

    if (config.onShippingAddressChange) {
      const updates = updatePaymentRequest(
        target.shippingAddress,
        config,
        tx,
        merchant
      ); // Do not await this promise
      event.updateWith(updates);
    } else {
      const update: PaymentDetailsUpdate = {};
      event.updateWith(update);
    }
  };

  // @ts-expect-error - Apple Pay overrides PaymentRequest properties
  baseRequest.onpaymentmethodchange = (event: PaymentMethodChangeEvent) => {
    const target = event.methodDetails as PaymentMethodUpdate;

    if (config.onPaymentMethodChange) {
      const updates = updatePaymentMethod(target, config, tx, merchant);
      return event.updateWith(updates);
    }

    return event.updateWith({});
  };

  return baseRequest;
}

async function createPaymentUpdate(
  updatedTransactionConfig: {
    amount: number;
    lineItems?: TransactionLineItem[];
  },
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<PaymentDetailsUpdate> {
  const displayItems = (updatedTransactionConfig.lineItems ?? []).map(
    (item) => ({
      label: item.label,
      amount: {
        value: (item.amount / 100).toFixed(2).toString(),
        currency: tx.currency,
      },
    })
  );
  const total = {
    label: tx.priceLabel ?? merchant.name,
    amount: {
      currency: tx.currency,
      value: (updatedTransactionConfig.amount / 100).toFixed(2),
    },
  };
  return {
    displayItems,
    total,
  };
}

async function updatePaymentRequest(
  newAddress: ShippingAddress,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<PaymentDetailsUpdate> {
  const updatedTransactionConfig = await config.onShippingAddressChange!(
    newAddress
  );
  return createPaymentUpdate(updatedTransactionConfig, tx, merchant);
}

async function updatePaymentMethod(
  newMethod: PaymentMethodUpdate,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<PaymentDetailsUpdate> {
  const updatedTransactionConfig = await config.onPaymentMethodChange!(
    newMethod
  );
  return createPaymentUpdate(updatedTransactionConfig, tx, merchant);
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
      label: tx.priceLabel ?? merchant.name,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
  };

  const paymentOptions = {
    requestPayerName: config.requestPayerDetails?.includes("name") ?? false,
    requestBillingAddress: config.requestBillingAddress ?? false,
    requestPayerEmail: config.requestPayerDetails?.includes("email") ?? false,
    requestPayerPhone: config.requestPayerDetails?.includes("phone") ?? false,
    requestPostalAddress:
      config.requestPayerDetails?.includes("postalAddress") ?? false,
    requestShipping: config.requestShipping ?? false,
    shippingType: "shipping",
    onShippingAddressChange: config.onShippingAddressChange,
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

// same as RecurringPaymentIntervalUnit but without "week"
type NormalizedRecurringInterval = "minute" | "hour" | "day" | "month" | "year";

function normalizeRecurringInterval(
  unit?: RecurringPaymentIntervalUnit,
  count?: number
): { recurringPaymentIntervalUnit?: NormalizedRecurringInterval; recurringPaymentIntervalCount?: number } {
  if (!unit) return {};

  if (unit === "week") {
    return {
      recurringPaymentIntervalUnit: "day",
      recurringPaymentIntervalCount: (count ?? 1) * 7,
    };
  }

  return {
    recurringPaymentIntervalUnit: unit,
    ...(count != null && { recurringPaymentIntervalCount: count }),
  };
}

function buildRecurringSession(
  merchant: MerchantDetail,
  config: BuildSessionOptions,
  tx: RecurringTransactionDetails
) {
  console.log("Building recurring session");
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
      label: tx.priceLabel ?? merchant.name,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
    modifiers: [
      {
        supportedMethods: "https://apple.com/apple-pay",
        data: {
          recurringPaymentRequest: {
            paymentDescription: tx.description,
            regularBilling: {
              label: tx.regularBilling.label,
              amount: tx.regularBilling.amount,
              paymentTiming: "recurring",
              recurringPaymentStartDate:
                tx.regularBilling.recurringPaymentStartDate,
              ...normalizeRecurringInterval(
                tx.regularBilling.recurringPaymentIntervalUnit,
                tx.regularBilling.recurringPaymentIntervalCount
              ),
              },
            trialBilling: tx.trialBilling
              ? {
                  label: tx.trialBilling.label,
                  amount: tx.trialBilling.amount,
                  paymentTiming: "recurring",
                  recurringPaymentStartDate:
                    tx.trialBilling.trialPaymentStartDate,
                }
              : undefined,
            billingAgreement: tx.billingAgreement,
            managementURL: tx.managementURL,
          },
        },
      },
    ],
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
      label: tx.priceLabel ?? merchant.name,
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

async function getMerchant(
  applePay: ApplePayButton,
  id: string
): Promise<MerchantDetail | undefined> {
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

export function resolveUnit(input: string | number) {
  if (typeof input === "number") {
    return `${input}px`;
  }

  return input;
}
