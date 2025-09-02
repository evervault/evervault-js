import {
  NativeProps,
  ButtonStyle,
  ButtonType,
  AuthorizePaymentEvent,
  SummaryItem,
  Transaction,
  ShippingMethod,
} from "../specs/ApplePayButtonViewNativeComponent";

export interface ApplePayNetworkTokenExpiry {
  month: number;
  year: number;
}

export interface ApplePayNetworkToken {
  number: string;
  expiry: ApplePayNetworkTokenExpiry;
  rawExpiry: string;
  tokenServiceProvider: string;
}

export interface ApplePayCard {
  brand: string | null;
  funding: string | null;
  segment: string | null;
  country: string | null;
  currency: string | null;
  issuer: string | null;
}

export interface ApplePayResponse {
  networkToken: ApplePayNetworkToken;
  card: ApplePayCard;
  cryptogram: string;
  eci: number | null;
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
}

export interface ApplePaySummaryItem {
  label: string;
  amount: `${number}`;
}

export type ApplePayShippingType = NonNullable<Transaction["shippingType"]>;

export interface ApplePayShippingMethod extends ApplePaySummaryItem {
  detail?: string;
  identifier?: string;
  dateRange?: {
    start: Date | string | number;
    end: Date | string | number;
  };
}

// https://developer.apple.com/documentation/passkit/pkcontactfield
export type ApplePayContactField =
  | "emailAddress"
  | "name"
  | "phoneNumber"
  | "phoneticName"
  | "postalAddress";

export interface BaseApplePayTransaction {
  country: string;
  currency: string;
  paymentSummaryItems: ApplePaySummaryItem[];
  shippingType?: ApplePayShippingType;
  shippingMethods?: ApplePayShippingMethod[];
  requiredShippingContactFields?: ApplePayContactField[];
}

export interface ApplePayOneOffTransaction extends BaseApplePayTransaction {
  type: "oneOff";
}

export interface ApplePayDisbursementTransaction
  extends BaseApplePayTransaction {
  type: "disbursement";
}

export interface ApplePayRecurringTransaction extends BaseApplePayTransaction {
  type: "recurring";
}

export type ApplePayTransaction =
  | ApplePayOneOffTransaction
  | ApplePayDisbursementTransaction
  | ApplePayRecurringTransaction;

// Map RN networks to PKPaymentNetwork
// https://developer.apple.com/documentation/passkit/pkpaymentnetwork
export const supportedNetworkMap = Object.freeze({
  visa: "visa",
  mastercard: "masterCard",
  amex: "amex",
  discover: "discover",
  jcb: "JCB",
});

export type ApplePaySupportedNetwork = keyof typeof supportedNetworkMap;

export type ApplePayButtonStyle = ButtonStyle;

export type ApplePayButtonType = ButtonType;

export type ApplePayError =
  | "InvalidTransactionError"
  | "EmptyTransactionError"
  | "InvalidCurrencyError"
  | "InvalidCountryError"
  | "ApplePayUnavailableError"
  | "ApplePayPaymentSheetError"
  | "UnsupportedVersionError"
  | "ApplePayAuthorizationError"
  | "InternalError";

export type ApplePayFinishWithResultEvent =
  | { success: true }
  | { success: false; code: ApplePayError; error: string };

export type ApplePayAuthorizedPaymentEvent = AuthorizePaymentEvent;

export interface ApplePayButtonProps
  extends Omit<
    NativeProps,
    | "transaction"
    | "supportedNetworks"
    | "onFinishWithResult"
    | "onAuthorizePayment"
  > {
  transaction: ApplePayTransaction;
  supportedNetworks?: ApplePaySupportedNetwork[];
  onFinishWithResult?: (event: ApplePayFinishWithResultEvent) => void;
  onAuthorizePayment?: (event: ApplePayResponse) => void;
}
