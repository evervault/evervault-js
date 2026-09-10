import {
  EncryptedGooglePayData,
  GooglePayShippingOptionsConfig,
  MerchantDetail,
  TransactionLineItem,
} from "types";
import { GooglePayConfig } from "./types";
import { apiConfig } from "../utilities/config";

// Shared for the two builders so they can't drift apart. Named to match the Android SDK's
// equivalent (PaymentRequest.kt's baseRequest()).
function baseRequest() {
  return { apiVersion: 2, apiVersionMinor: 0 } as const;
}

// The card payment method spec is the same for both the full payment request
// and the isReadyToPay request.
function baseCardPaymentMethod(
  config: GooglePayConfig
): google.payments.api.IsReadyToPayPaymentMethodSpecification {
  return {
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
      allowPrepaidCards: config.allowPrepaidCards,
      allowCreditCards: config.allowCreditCards,
      assuranceDetailsRequired: config.assuranceDetailsRequired,
      billingAddressRequired: isBillingRequired(config),
      // Google ignores these when billingAddressRequired is false. Omit
      // them so the request says only what it means, and so it matches the
      // Android SDK.
      ...(isBillingRequired(config)
        ? {
            billingAddressParameters: {
              format: billingAddressFormat(config),
              phoneNumberRequired: phoneNumberRequired(config),
            },
          }
        : {}),
    },
  };
}

export function buildPaymentRequest(
  config: GooglePayConfig,
  merchant: MerchantDetail
): google.payments.api.PaymentDataRequest {
  const tx = config.transaction;
  return {
    ...baseRequest(),
    emailRequired: config.emailRequired ?? false,
    allowedPaymentMethods: [
      {
        ...baseCardPaymentMethod(config),
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
      merchantOrigin: tx.domain, // merchantOrigin is not present in the GooglePayConfig type but is noted as required by the GooglePay API
      softwareInfo: config.softwareInfo,
    } as unknown as google.payments.api.MerchantInfo,
    ...(isShippingRequired(config)
      ? {
          shippingAddressRequired: true,
          shippingAddressParameters: shippingAddressParameters(config),
        }
      : {}),
    ...(config.shippingOptions
      ? {
          shippingOptionRequired: true,
          shippingOptionParameters: shippingOptionParameters(
            config.shippingOptions
          ),
        }
      : {}),
    transactionInfo: buildTransactionInfo(config, merchant.name),
    callbackIntents: callbackIntents(config),
  };
}

/**
 * Google raises shipping callbacks only for the intents the request declares,
 * so the intent list has to follow the config rather than be hardcoded.
 */
export function callbackIntents(
  config: GooglePayConfig
): google.payments.api.CallbackIntent[] {
  const intents: google.payments.api.CallbackIntent[] = [];
  if (isShippingRequired(config)) intents.push("SHIPPING_ADDRESS");
  if (config.shippingOptions) intents.push("SHIPPING_OPTION");
  intents.push("PAYMENT_AUTHORIZATION");
  return intents;
}

export function buildTransactionInfo(
  config: GooglePayConfig,
  merchantName: string,
  overrides: { amount?: number; lineItems?: TransactionLineItem[] } = {}
): google.payments.api.TransactionInfo {
  const tx = config.transaction;
  const amount = overrides.amount ?? tx.amount;
  const lineItems = overrides.lineItems ?? tx.lineItems;

  return {
    totalPriceStatus: config.totalPriceStatus ?? "FINAL",
    totalPriceLabel: tx.priceLabel ?? `Pay ${merchantName}`,
    totalPrice: formatAmount(amount),
    currencyCode: tx.currency,
    countryCode: tx.country,
    checkoutOption: config.checkoutOption,
    transactionId: config.transactionId,
    displayItems: lineItems?.map((item) => ({
      label: item.label,
      type: displayItemType(item.category),
      price: formatAmount(item.amount),
    })),
  };
}

export function buildIsReadyToPayRequest(
  config: GooglePayConfig
): google.payments.api.IsReadyToPayRequest {
  return {
    ...baseRequest(),
    allowedPaymentMethods: [baseCardPaymentMethod(config)],
    existingPaymentMethodRequired: config.existingPaymentMethodRequired,
  };
}

// Google's DisplayItemType is a category (LINE_ITEM/SUBTOTAL/TAX/...), distinct
// from TransactionLineItem's own "final"/"pending" status field. Defaults to
// LINE_ITEM to match today's behaviour when category is omitted.
function displayItemType(
  category: TransactionLineItem["category"]
): google.payments.api.DisplayItemType {
  switch (category) {
    case "subtotal":
      return "SUBTOTAL";
    case "tax":
      return "TAX";
    case "discount":
      return "DISCOUNT";
    case "shipping_option":
      return "SHIPPING_OPTION";
    default:
      return "LINE_ITEM";
  }
}

export function shippingOptionParameters(
  shippingOptions: GooglePayShippingOptionsConfig
): google.payments.api.ShippingOptionParameters {
  return {
    shippingOptions: shippingOptions.options.map((option) => ({
      id: option.id,
      label: option.label,
      description: option.description ?? "",
    })),
    ...(shippingOptions.defaultSelectedOptionId
      ? { defaultSelectedOptionId: shippingOptions.defaultSelectedOptionId }
      : {}),
  };
}

function formatAmount(amount: number): string {
  return (amount / 100).toFixed(2).toString();
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

function isBillingRequired(config: GooglePayConfig): boolean {
  const billingConfig = config.billingAddress;
  if (typeof billingConfig === "boolean") return billingConfig;
  return !!billingConfig;
}

function billingAddressFormat(
  config: GooglePayConfig
): google.payments.api.BillingAddressFormat {
  const billingConfig = config.billingAddress;
  if (typeof billingConfig === "boolean") return "FULL";
  return billingConfig?.format || "FULL";
}

function phoneNumberRequired(config: GooglePayConfig): boolean {
  const billingConfig = config.billingAddress;
  if (typeof billingConfig === "boolean") return false;
  return billingConfig?.phoneNumber || false;
}

export function isShippingRequired(config: GooglePayConfig): boolean {
  return !!config.shippingAddress || !!config.shippingOptions;
}

function shippingAddressParameters(
  config: GooglePayConfig
): google.payments.api.ShippingAddressParameters {
  return typeof config.shippingAddress === "object"
    ? config.shippingAddress
    : {};
}
