import {
  NativeProps,
  ButtonStyle,
  ButtonType,
  AuthorizePaymentEvent,
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
    "supportedNetworks" | "onFinishWithResult" | "onAuthorizePayment"
  > {
  supportedNetworks?: ApplePaySupportedNetwork[];
  onFinishWithResult?: (event: ApplePayFinishWithResultEvent) => void;
  onAuthorizePayment?: (event: ApplePayResponse) => void;
}
