import {
  NativeProps,
  ButtonStyle,
  ButtonType,
  AuthorizePaymentEvent,
} from "../specs/ApplePayButtonViewNativeComponent";

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
  onAuthorizePayment?: (event: AuthorizePaymentEvent) => void;
}
