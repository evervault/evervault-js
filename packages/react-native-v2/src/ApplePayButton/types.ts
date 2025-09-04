import { ViewProps } from "react-native";
import { ApplePayError, ApplePayResponse } from "./schema";

export type ApplePayButtonAppearance =
  | "automatic"
  | "black"
  | "white"
  | "white-outline";

export type ApplePayButtonPaymentType =
  | "plain"
  | "buy"
  | "addMoney"
  | "book"
  | "checkout";

export type ApplePayButtonSupportedNetwork =
  | "visa"
  | "masterCard"
  | "amex"
  | "discover";

export interface ApplePayButtonProps extends ViewProps {
  merchantId: string;
  supportedNetworks?: ApplePayButtonSupportedNetwork[];
  paymentType?: ApplePayButtonPaymentType;
  appearance?: ApplePayButtonAppearance;
  onAuthorizePayment?(response: ApplePayResponse): void;
  onError?(error: ApplePayError): void;
}
