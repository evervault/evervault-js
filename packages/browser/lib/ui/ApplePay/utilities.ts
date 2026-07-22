import { getAppSDKConfig } from "shared/getAppSDKConfig";
import {
  ApplePayMerchantCapability,
  ApplePayTransactionType,
  DisbursementTransactionDetails,
  MerchantDetail,
  PaymentTransactionDetails,
  RecurringTransactionDetails,
  TransactionDetails,
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
  CouponCodeUpdate,
  CouponCodeChangeResult,
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
  supportsCouponCode?: boolean;
  couponCode?: string;
  onCouponCodeChange?: (couponCode: string) => Promise<CouponCodeChangeResult>;
  prepareTransaction?: () => Promise<{
    amount?: number;
    lineItems?: TransactionLineItem[];
  }>;
  appleMerchantId?: string;
};

function isCouponCodeUpdate(details: unknown): details is CouponCodeUpdate {
  return (
    typeof details === "object" &&
    details !== null &&
    "couponCode" in details &&
    typeof (details as CouponCodeUpdate).couponCode === "string"
  );
}

function applyCouponFields(
  data: Record<string, unknown>,
  config: BuildSessionOptions
) {
  if (!config.supportsCouponCode) return;
  data.supportsCouponCode = true;
  data.couponCode = config.couponCode ?? "";
}

function buildApplePayMethodData(
  config: BuildSessionOptions,
  countryCode: string
): PaymentMethodData[] {
  const data: Record<string, unknown> = {
    version: 3,
    merchantIdentifier: resolveMerchantIdentifier(
      config.transaction.merchantId,
      config.appleMerchantId
    ),
    merchantCapabilities: ["supports3DS"],
    supportedNetworks: config.allowedCardNetworks?.map((network) =>
      network.toLowerCase()
    ) || ["visa", "masterCard", "amex", "discover"],
    countryCode,
  };
  applyCouponFields(data, config);

  return [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data,
    },
  ];
}

export function resolveMerchantIdentifier(
  evervaultMerchantId: string,
  appleMerchantId?: string
): string {
  return appleMerchantId ?? `merchant.com.evervault.${evervaultMerchantId}`;
}

export function resolveDisbursementMerchantCapabilities(
  tx: DisbursementTransactionDetails
): ApplePayMerchantCapability[] {
  if (tx.merchantCapabilities?.length) {
    return tx.merchantCapabilities;
  }

  const merchantCapabilities: ApplePayMerchantCapability[] = ["supports3DS"];

  if (tx.instantTransfer) {
    merchantCapabilities.push("supportsInstantFundsOut");
  }

  return merchantCapabilities;
}

export function mapTransactionType(
  type: TransactionDetails["type"]
): ApplePayTransactionType {
  switch (type) {
    case "payment":
      return "oneOff";
    case "recurring":
      return "recurring";
    case "disbursement":
      return "disbursement";
  }
}

export async function buildSession(
  applePay: ApplePayButton,
  config: BuildSessionOptions
) {
  const { transaction: tx } = config;

  const merchant = await getMerchant(applePay, tx.merchantId);
  if (!merchant) {
    throw new Error("Merchant not found");
  }

  const appConfig = await getAppSDKConfig(
    applePay.client.config.appId,
    applePay.client.config.http.apiUrl
  );
  if (appConfig.is_sandbox) {
    merchant.name = `${merchant.name} (Card is not charged)`;
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

  // Apple Pay requires calling updateWith on every shippingaddresschange.
  // Coupon updates may also arrive here (methodDetails.couponCode) without a
  // shipping address — never return early without updateWith.
  baseRequest.onshippingaddresschange = (event: PaymentRequestUpdateEvent) => {
    const target = event.target as unknown as {
      shippingAddress?: ShippingAddress;
    };
    const methodDetails = (
      event as PaymentRequestUpdateEvent & { methodDetails?: unknown }
    ).methodDetails;

    // Coupon updates must not fall through to shipping/payment handlers.
    if (isCouponCodeUpdate(methodDetails)) {
      if (config.onCouponCodeChange) {
        event.updateWith(
          updateCouponCode(methodDetails.couponCode, config, tx, merchant)
        );
        return;
      }
      event.updateWith({});
      return;
    }

    if (target.shippingAddress && config.onShippingAddressChange) {
      // Do not await this promise — PaymentRequest expects updateWith(promise).
      event.updateWith(
        updatePaymentRequest(target.shippingAddress, config, tx, merchant)
      );
      return;
    }

    event.updateWith({});
  };

  // Apple Pay widens PaymentRequest event types beyond the DOM lib.
  // @ts-expect-error - Apple Pay overrides PaymentRequest properties
  baseRequest.onpaymentmethodchange = (event: PaymentMethodChangeEvent) => {
    const methodDetails = event.methodDetails;

    // ApplePayCouponCodeDetails arrives on paymentmethodchange in some Safari versions.
    // Short-circuit so coupon-shaped events never reach onPaymentMethodChange.
    if (isCouponCodeUpdate(methodDetails)) {
      if (config.onCouponCodeChange) {
        return event.updateWith(
          updateCouponCode(methodDetails.couponCode, config, tx, merchant)
        );
      }
      return event.updateWith({});
    }

    if (config.onPaymentMethodChange) {
      const updates = updatePaymentMethod(
        methodDetails as PaymentMethodUpdate,
        config,
        tx,
        merchant
      );
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

async function updateCouponCode(
  couponCode: string,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<PaymentDetailsUpdate> {
  const result = await config.onCouponCodeChange!(couponCode);
  const update = await createPaymentUpdate(result, tx, merchant);

  if (result.error) {
    // Payment Request bridge: ApplePayError via paymentMethodErrors
    // (see Apple Pay Merchant Integration Guide / WebKit PaymentDetailsUpdate).
    update.paymentMethodErrors = [
      new ApplePayError(result.error.code, undefined, result.error.message),
    ];
  }

  return update;
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

  const paymentMethodData = buildApplePayMethodData(config, tx.country);

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
): {
  recurringPaymentIntervalUnit?: NormalizedRecurringInterval;
  recurringPaymentIntervalCount?: number;
} {
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

  const paymentMethodData = buildApplePayMethodData(config, tx.country);

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

  const merchantCapabilities = resolveDisbursementMerchantCapabilities(tx);

  const paymentMethodData = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: {
        version: 3,
        merchantIdentifier: resolveMerchantIdentifier(
          config.transaction.merchantId,
          config.appleMerchantId
        ),
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
