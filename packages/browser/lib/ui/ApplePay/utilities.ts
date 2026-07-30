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
  ApplePayShippingMethod,
  ApplePayShippingType,
  ApplePayPaymentDetailsInit,
  ApplePayPaymentDetailsUpdate,
  PaymentShippingOption,
  ShippingAddress,
  PaymentContact,
  PaymentMethodUpdate,
  CouponCodeUpdate,
  CouponCodeChangeResult,
} from "./types";
import ApplePayButton from ".";
import { RecurringPaymentIntervalUnit } from "types/uiComponents";

/**
 * Probe ceiling for `ApplePaySession.supportsVersion()`.
 *
 * Keep in sync with the major version of `@types/applepayjs` — a unit test fails
 * if that package moves ahead of this constant.
 */
export const APPLE_PAY_MAX_VERSION = 14;

type BuildSessionOptions = {
  transaction: TransactionDetailsWithDomain;
  allowedCardNetworks?: ApplePayCardNetwork[];
  requestPayerDetails?: ("name" | "email" | "phone" | "postalAddress")[];
  requestBillingAddress?: boolean;
  requestShipping?: boolean;
  shippingType?: ApplePayShippingType;
  shippingMethods?: ApplePayShippingMethod[];
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: ApplePayPaymentDetailsInit;
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
  onShippingMethodSelected?: (
    shippingMethod: ApplePayShippingMethod
  ) => Promise<{ amount: number; lineItems?: TransactionLineItem[] }>;
  supportsCouponCode?: boolean;
  couponCode?: string;
  onCouponCodeChange?: (couponCode: string) => Promise<CouponCodeChangeResult>;
  billingContact?: PaymentContact;
  shippingContact?: PaymentContact;
  applicationData?: string;
  supportedCountries?: string[];
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

function applyContactFields(
  data: Record<string, unknown>,
  config: BuildSessionOptions
) {
  if (config.billingContact) {
    data.billingContact = config.billingContact;
  }
  if (config.shippingContact) {
    data.shippingContact = config.shippingContact;
  }
}

/**
 * Shipping methods are only supported on one-off payment transactions.
 * Recurring and disbursement reject them (CARD-875 AC).
 */
function assertShippingMethodsAllowed(
  tx: TransactionDetailsWithDomain,
  config: BuildSessionOptions
) {
  if (!config.shippingMethods?.length) return;

  if (tx.type !== "payment") {
    throw new Error(
      "Apple Pay shipping methods are only supported for one-off payment transactions"
    );
  }
}

function mapPaymentRequestShippingType(
  shippingType?: ApplePayShippingType
): "shipping" | "delivery" | "pickup" {
  if (shippingType === "delivery") return "delivery";
  if (shippingType === "storePickup" || shippingType === "servicePickup") {
    return "pickup";
  }
  return "shipping";
}

function mapShippingMethodsToPaymentOptions(
  methods: ApplePayShippingMethod[],
  currency: string
): PaymentShippingOption[] {
  const hasExplicitSelection = methods.some((method) => method.selected);
  return methods.map((method, index) => {
    const option: PaymentShippingOption = {
      id: method.id,
      label: method.label,
      amount: {
        currency,
        value: (method.amount / 100).toFixed(2),
      },
      selected: hasExplicitSelection ? Boolean(method.selected) : index === 0,
    };
    if (method.detail != null) {
      option.detail = method.detail;
    }
    return option;
  });
}

function resolveSelectedShippingMethod(
  shippingOptionId: string | null | undefined,
  methods: ApplePayShippingMethod[]
): ApplePayShippingMethod | undefined {
  if (!methods.length) return undefined;
  if (shippingOptionId) {
    return methods.find((method) => method.id === shippingOptionId);
  }
  return methods.find((method) => method.selected) ?? methods[0];
}

/**
 * Goods total excluding the initially selected shipping method amount.
 * When a method is marked selected (or the first is defaulted), the transaction
 * amount is treated as already including that method's cost — matching the iOS
 * summary-items pattern.
 */
function resolveGoodsAmount(
  tx: TransactionDetailsWithDomain,
  methods: ApplePayShippingMethod[]
): number {
  if (!methods.length) return tx.amount;
  const initial = methods.find((method) => method.selected) ?? methods[0];
  return tx.amount - initial.amount;
}

function withUpdatedShippingSelection(
  methods: ApplePayShippingMethod[],
  selectedId: string,
  currency: string
): PaymentShippingOption[] {
  return mapShippingMethodsToPaymentOptions(
    methods.map((method) => ({
      ...method,
      selected: method.id === selectedId,
    })),
    currency
  );
}

function buildInternalShippingMethodUpdate(
  selected: ApplePayShippingMethod,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain
): { amount: number; lineItems?: TransactionLineItem[] } {
  const methods = config.shippingMethods ?? [];
  const goodsAmount = resolveGoodsAmount(tx, methods);
  const amount = goodsAmount + selected.amount;

  const methodLabels = new Set(methods.map((method) => method.label));
  const baseLineItems = (tx.lineItems ?? []).filter(
    (item) => !methodLabels.has(item.label)
  );

  return {
    amount,
    lineItems: [
      ...baseLineItems,
      {
        label: selected.label,
        amount: selected.amount,
      },
    ],
  };
}

function assertBase64ApplicationData(applicationData: string) {
  if (typeof applicationData !== "string") {
    throw new Error("applicationData must be a Base64-encoded string");
  }

  try {
    atob(applicationData);
  } catch {
    throw new Error("applicationData must be a Base64-encoded string");
  }
}

function applyRequestPassthroughFields(
  data: Record<string, unknown>,
  config: BuildSessionOptions
) {
  if (config.applicationData !== undefined) {
    assertBase64ApplicationData(config.applicationData);
    data.applicationData = config.applicationData;
  }
  if (config.supportedCountries !== undefined) {
    data.supportedCountries = config.supportedCountries;
  }
}

function mapLineItemsToDisplayItems(
  lineItems: TransactionLineItem[] | undefined,
  currency: string
): PaymentItem[] {
  return (lineItems ?? []).map((item) => ({
    label: item.label,
    amount: {
      value: (item.amount / 100).toFixed(2).toString(),
      currency,
    },
    ...(item.type === "pending" ? { pending: true } : {}),
  }));
}

/**
 * Pick the highest Apple Pay JS API version supported by the current browser,
 * probing from `maxVersion` downward. Falls back to 3 when ApplePaySession is
 * unavailable (e.g. unit tests / non-Safari), matching the previous hardcoded default.
 */
export function resolveApplePayVersion(
  maxVersion = APPLE_PAY_MAX_VERSION
): number {
  if (
    typeof ApplePaySession === "undefined" ||
    typeof ApplePaySession.supportsVersion !== "function"
  ) {
    return 3;
  }

  for (let version = maxVersion; version >= 1; version--) {
    if (ApplePaySession.supportsVersion(version)) {
      return version;
    }
  }

  return 3;
}

function buildApplePayMethodData(
  config: BuildSessionOptions,
  countryCode: string
): PaymentMethodData[] {
  const data: Record<string, unknown> = {
    version: resolveApplePayVersion(),
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
  applyContactFields(data, config);
  applyRequestPassthroughFields(data, config);

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
  assertShippingMethodsAllowed(tx, config);

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
    // event.target can be null here — e.g. Apple's apple-pay-sdk.js polyfill
    // invokes this with a null target during the desktop-Chrome + phone-QR
    // remote-continuity handoff.
    const target = event.target as unknown as {
      shippingAddress?: ShippingAddress;
    } | null;
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

    if (target?.shippingAddress && config.onShippingAddressChange) {
      // Do not await this promise — PaymentRequest expects updateWith(promise).
      event.updateWith(
        updatePaymentRequest(target.shippingAddress, config, tx, merchant)
      );
      return;
    }

    event.updateWith({});
  };

  // Apple Pay requires updateWith on every shippingoptionchange or the
  // selection silently no-ops. Prefer the merchant callback when provided;
  // otherwise recompute totals from the selected method amount.
  baseRequest.onshippingoptionchange = (event: PaymentRequestUpdateEvent) => {
    const target = event.target as ApplePayPaymentRequest | null;
    const selectedId =
      target?.shippingOption ?? baseRequest.shippingOption ?? null;

    event.updateWith(updateShippingMethod(selectedId, config, tx, merchant));
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
  merchant: MerchantDetail,
  shippingOptions?: PaymentShippingOption[]
): Promise<ApplePayPaymentDetailsUpdate> {
  const displayItems = mapLineItemsToDisplayItems(
    updatedTransactionConfig.lineItems,
    tx.currency
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
    ...(shippingOptions ? { shippingOptions } : {}),
  };
}

async function updatePaymentRequest(
  newAddress: ShippingAddress,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<ApplePayPaymentDetailsUpdate> {
  const updatedTransactionConfig = await config.onShippingAddressChange!(
    newAddress
  );
  const shippingOptions = config.shippingMethods?.length
    ? mapShippingMethodsToPaymentOptions(config.shippingMethods, tx.currency)
    : undefined;
  return createPaymentUpdate(
    updatedTransactionConfig,
    tx,
    merchant,
    shippingOptions
  );
}

async function updatePaymentMethod(
  newMethod: PaymentMethodUpdate,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<ApplePayPaymentDetailsUpdate> {
  const updatedTransactionConfig = await config.onPaymentMethodChange!(
    newMethod
  );
  return createPaymentUpdate(updatedTransactionConfig, tx, merchant);
}

async function updateShippingMethod(
  shippingOptionId: string | null,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<ApplePayPaymentDetailsUpdate> {
  const methods = config.shippingMethods ?? [];
  const selected = resolveSelectedShippingMethod(shippingOptionId, methods);

  if (!selected) {
    return {};
  }

  const shippingOptions = withUpdatedShippingSelection(
    methods,
    selected.id,
    tx.currency
  );

  if (config.onShippingMethodSelected) {
    const updatedTransactionConfig = await config.onShippingMethodSelected(
      selected
    );
    return createPaymentUpdate(
      updatedTransactionConfig,
      tx,
      merchant,
      shippingOptions
    );
  }

  return createPaymentUpdate(
    buildInternalShippingMethodUpdate(selected, config, tx),
    tx,
    merchant,
    shippingOptions
  );
}

async function updateCouponCode(
  couponCode: string,
  config: BuildSessionOptions,
  tx: TransactionDetailsWithDomain,
  merchant: MerchantDetail
): Promise<ApplePayPaymentDetailsUpdate> {
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
  const lineItems = mapLineItemsToDisplayItems(tx.lineItems, tx.currency);

  const paymentMethodData = buildApplePayMethodData(config, tx.country);
  const shippingOptions = config.shippingMethods?.length
    ? mapShippingMethodsToPaymentOptions(config.shippingMethods, tx.currency)
    : undefined;
  const requestShipping =
    config.requestShipping || Boolean(config.shippingMethods?.length);

  const paymentDetails: ApplePayPaymentDetailsInit = {
    total: {
      label: tx.priceLabel ?? merchant.name,
      amount: { currency: tx.currency, value: (tx.amount / 100).toFixed(2) },
    },
    displayItems: lineItems,
    ...(shippingOptions ? { shippingOptions } : {}),
  };

  const paymentOptions = {
    requestPayerName: config.requestPayerDetails?.includes("name") ?? false,
    requestBillingAddress: config.requestBillingAddress ?? false,
    requestPayerEmail: config.requestPayerDetails?.includes("email") ?? false,
    requestPayerPhone: config.requestPayerDetails?.includes("phone") ?? false,
    requestPostalAddress:
      config.requestPayerDetails?.includes("postalAddress") ?? false,
    requestShipping,
    shippingType: mapPaymentRequestShippingType(config.shippingType),
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
  const lineItems = mapLineItemsToDisplayItems(tx.lineItems, tx.currency);

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
      ...(item.type ? { type: item.type } : {}),
    })) || [];

  const merchantCapabilities = resolveDisbursementMerchantCapabilities(tx);

  // Disbursements collect recipient info via disbursementRequest.requiredRecipientContactFields
  // — billingContact/shippingContact are not used on this path.
  const disbursementMethodData: Record<string, unknown> = {
    version: resolveApplePayVersion(),
    merchantIdentifier: resolveMerchantIdentifier(
      config.transaction.merchantId,
      config.appleMerchantId
    ),
    merchantCapabilities,
    supportedNetworks: config.allowedCardNetworks,
    countryCode: tx.country,
  };
  applyRequestPassthroughFields(disbursementMethodData, config);

  const paymentMethodData = [
    {
      supportedMethods: "https://apple.com/apple-pay",
      data: disbursementMethodData,
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
