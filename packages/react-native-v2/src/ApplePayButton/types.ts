import { ViewProps } from "react-native";

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

export interface ApplePayNetworkToken {
  number: string;
  expiry: {
    month: string;
    year: string;
  };
  rawExpiry: string;
  tokenServiceProvider: string;
}

export interface ApplePayCard {
  brand?: string;
  funding?: string;
  segment?: string;
  country?: string;
  currency?: string;
  issuer?: string;
}

export interface ApplePayResponse {
  networkToken: ApplePayNetworkToken;
  card: ApplePayCard;
  cryptogram: string;
  eci?: string;
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
}

export type Result<T, U> =
  | { success: true; data: T; error: undefined }
  | { success: false; data: undefined; error: U };

export interface ApplePayButtonProps extends ViewProps {
  merchantId: string;
  supportedNetworks?: ApplePayButtonSupportedNetwork[];
  paymentType?: ApplePayButtonPaymentType;
  appearance?: ApplePayButtonAppearance;
  onAuthorizePayment?(response: ApplePayResponse): void;
  onFinishWithResult?(result: Result<void, string>): void;
}
