import { TransactionDetailsWithDomain } from "types";

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

export interface ApplePayPaymentRequest extends PaymentRequest {
  onshippingaddresschange?: (event: PaymentRequestUpdateEvent) => void;
  onmerchantvalidation?: (event: OnMerchantValidationEvent) => void;
}

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
  requestPayerDetails?: ("name" | "email" | "phone")[];
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
