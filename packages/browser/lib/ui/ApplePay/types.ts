import { TransactionDetailsWithDomain, TransactionLineItem } from "types";

export type ApplePayButtonType =
  | "add-money"
  | "book"
  | "buy"
  | "check-out"
  | "continue"
  | "contribute"
  | "donate"
  | "order"
  | "pay"
  | "plain"
  | "reload"
  | "rent"
  | "set-up"
  | "subscribe"
  | "support"
  | "tip"
  | "top-up";

export type ApplePayButtonStyle = "black" | "white" | "white-outline";

export type ApplePayButtonLocale =
  | "ar-AB"
  | "ca-ES"
  | "cs-CZ"
  | "da-DK"
  | "de-DE"
  | "el-GR"
  | "en-AU"
  | "en-GB"
  | "en-US"
  | "es-ES"
  | "es-MX"
  | "fi-FI"
  | "fr-CA"
  | "fr-FR"
  | "he-IL"
  | "hi-IN"
  | "hr-HR"
  | "hu-HU"
  | "id-ID"
  | "it-IT"
  | "ja-JP"
  | "ko-KR"
  | "ms-MY"
  | "nb-NO"
  | "nl-NL"
  | "pl-PL"
  | "pt-BR"
  | "pt-PT"
  | "ro-RO"
  | "ru-RU"
  | "sk-SK"
  | "sv-SE"
  | "th-TH"
  | "tr-TR"
  | "uk-UA"
  | "vi-VN"
  | "zh-CN"
  | "zh-HK"
  | "zh-TW";

export type ApplePayCardNetwork =
  | "amex"
  | "bancomat"
  | "bancontact"
  | "cartesBancaires"
  | "chinaUnionPay"
  | "dankort"
  | "discover"
  | "eftpos"
  | "electron"
  | "elo"
  | "girocard"
  | "interac"
  | "jcb"
  | "mada"
  | "maestro"
  | "masterCard"
  | "mir"
  | "privateLabel"
  | "visa"
  | "vPay";

interface OnMerchantValidationEvent extends Event {
  complete: (data: unknown) => Promise<unknown>;
  validationURL: string;
}

export interface ShippingAddress {
  addressLine: string[];
  city: string;
  country: string;
  dependentLocality: string;
  organization: string;
  phone: string;
  postalCode: string;
  recipient: string;
  region: string;
  sortingCode: string;
}

/**
 * Shipping type shown on the Apple Pay sheet. Maps to PaymentOptions.shippingType
 * (storePickup / servicePickup → "pickup" on the Payment Request bridge).
 */
export type ApplePayShippingType =
  | "shipping"
  | "delivery"
  | "storePickup"
  | "servicePickup";

/**
 * A shipping method the customer can pick on the Apple Pay sheet.
 * Amounts use the same smallest-currency-unit convention as line items (e.g. cents).
 * Maps to PaymentDetailsInit.shippingOptions / PaymentShippingOption.
 */
export interface ApplePayShippingMethod {
  id: string;
  label: string;
  amount: number;
  detail?: string;
  selected?: boolean;
}

/** W3C PaymentShippingOption (+ optional Apple `detail`). */
export interface PaymentShippingOption {
  id: string;
  label: string;
  amount: {
    currency: string;
    value: string;
  };
  selected?: boolean;
  detail?: string;
}

/** PaymentDetailsInit with shippingOptions (missing from some DOM lib versions). */
export type ApplePayPaymentDetailsInit = PaymentDetailsInit & {
  shippingOptions?: PaymentShippingOption[];
};

/** PaymentDetailsUpdate with shippingOptions. */
export type ApplePayPaymentDetailsUpdate = PaymentDetailsUpdate & {
  shippingOptions?: PaymentShippingOption[];
};

/**
 * Maps to ApplePayPaymentContact. Used to prefill billingContact /
 * shippingContact on the Apple Pay request, and for billingContact on
 * payment method change updates.
 */
export interface PaymentContact {
  phoneNumber?: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
  phoneticGivenName?: string;
  phoneticFamilyName?: string;
  addressLines?: string[];
  subLocality?: string;
  locality?: string;
  postalCode?: string;
  subAdministrativeArea?: string;
  administrativeArea?: string;
  country?: string;
  countryCode?: string;
}

/** Alias kept for PaymentMethodUpdate.billingContact consumers. */
export type BillingContact = PaymentContact;

export interface PaymentMethodUpdate {
  type?: string;
  billingContact?: BillingContact;
}

/** Apple Pay PaymentRequest bridge: ApplePayCouponCodeDetails on change events. */
export interface CouponCodeUpdate {
  couponCode: string;
}

/** Maps to ApplePayErrorCode values for coupon validation on the sheet. */
export type ApplePayCouponCodeErrorCode =
  | "couponCodeInvalid"
  | "couponCodeExpired";

export type CouponCodeChangeResult = {
  amount: number;
  lineItems?: TransactionLineItem[];
  /**
   * When set, surfaced to the Apple Pay sheet via PaymentDetailsUpdate.paymentMethodErrors
   * (ApplePayError with couponCodeInvalid / couponCodeExpired).
   */
  error?: {
    code: ApplePayCouponCodeErrorCode;
    message: string;
  };
};

export type ApplePayPaymentRequest = PaymentRequest & {
  onshippingaddresschange?: ((event: PaymentRequestUpdateEvent) => void) | null;
  onshippingoptionchange?: ((event: PaymentRequestUpdateEvent) => void) | null;
  onmerchantvalidation?: (event: OnMerchantValidationEvent) => void;
  shippingOption?: string | null;
};

export interface ApplePayConfig {
  transaction: TransactionDetailsWithDomain;
  type: ApplePayButtonType;
  style: ApplePayButtonStyle;
  locale: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: number;
  allowedCardNetworks?: string[];
  //These two allow users to add any additional data to the Apple Pay request that we don't currently support
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
  requestPayerDetails?: ("name" | "email" | "phone" | "postalAddress")[];
}

export interface ValidateMerchantResponse {
  sessionData: {
    displayName: string;
    domainName: string;
    epochTimestamp: number;
    expiresAt: number;
    merchantIdentifier: string;
    merchantSessionIdentifier: string;
    nonce: string;
    operationalAnalyticsIdentifier: string;
    pspId: string;
    retries: number;
    signature: string;
  };
}

export interface DisbursementContactDetails extends DisbursementContactAddress {
  emailAddress?: string;
  familyName?: string;
  givenName?: string;
  phoneNumber?: string;
}

export interface DisbursementContactAddress {
  addressLines?: string[];
  administrativeArea?: string;
  country?: string;
  countryCode?: string;
  locality?: string;
  postalCode?: string;
  subAdministrativeArea?: string;
  subLocality?: string;
}

export interface ApplePayToken {
  version: string;
  data: string;
  signature: string;
  header: {
    ephemeralPublicKey?: string;
    wrappedKey?: string;
    publicKeyHash: string;
    transactionId: string;
    applicatoinData?: string;
  };
}
