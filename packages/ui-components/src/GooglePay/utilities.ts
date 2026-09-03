import { EncryptedGooglePayData, MerchantDetail, TransactionLineItem } from "types";
import { GooglePayConfig } from "./types";
import { apiConfig } from "../utilities/config";

export function buildPaymentRequest(
  config: GooglePayConfig,
  merchant: MerchantDetail
): google.payments.api.PaymentDataRequest {
  const tx = config.transaction;
  return {
    apiVersion: 2,
    apiVersionMinor: 0,
    emailRequired: config.emailRequired ?? false,
    allowedPaymentMethods: [
      {
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
    transactionInfo: {
      totalPriceStatus: config.totalPriceStatus ?? "FINAL",
      totalPriceLabel: tx.priceLabel ?? `Pay ${merchant.name}`,
      totalPrice: (tx.amount / 100).toFixed(2).toString(),
      currencyCode: tx.currency,
      countryCode: tx.country,
      checkoutOption: config.checkoutOption,
      transactionId: config.transactionId,
      displayItems: tx.lineItems?.map((item) => ({
        label: item.label,
        type: displayItemType(item.category),
        price: (item.amount / 100).toFixed(2).toString(),
      })),
    },
    callbackIntents: ["PAYMENT_AUTHORIZATION"],
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
    default:
      return "LINE_ITEM";
  }
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
