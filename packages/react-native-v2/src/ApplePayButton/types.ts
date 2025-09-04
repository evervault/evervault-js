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

// https://developer.apple.com/documentation/passkit/pkshippingtype
export type ShippingType =
  | "shipping"
  | "delivery"
  | "storePickup"
  | "servicePickup";

// https://developer.apple.com/documentation/passkit/pkpaymentsummaryitem
export interface SummaryItem {
  label: string;
  amount: string;
}

export interface DateComponents {
  year: number;
  month: number;
  day: number;
}

// https://developer.apple.com/documentation/passkit/pkdatecomponentsrange
export interface DateComponentsRange {
  startDateComponents: DateComponents;
  endDateComponents: DateComponents;
}

// https://developer.apple.com/documentation/passkit/pkshippingmethod
export interface ShippingMethod extends SummaryItem {
  detail?: string;
  dateComponentsRange?: DateComponentsRange;
  identifier?: string;
}

// https://developer.apple.com/documentation/passkit/pkcontactfield
export type ContactField =
  | "emailAddress"
  | "name"
  | "phoneNumber"
  | "phoneticName"
  | "postalAddress";

export interface OneOffPaymentTransaction {
  type: "oneOffPayment";
  country: string;
  currency: string;
  paymentSummaryItems: SummaryItem[];
  shippingType?: ShippingType;
  shippingMethods?: ShippingMethod[];
  requiredShippingContactFields?: ContactField[];
}

export type Transaction = OneOffPaymentTransaction;

export interface ApplePayButtonProps extends ViewProps {
  merchantId: string;
  supportedNetworks?: ApplePayButtonSupportedNetwork[];
  paymentType?: ApplePayButtonPaymentType;
  appearance?: ApplePayButtonAppearance;
  onAuthorizePayment?(response: ApplePayResponse): void;
  onError?(error: ApplePayError): void;
  onPrepareTransaction(): Transaction | Promise<Transaction>;
}

export type { ApplePayResponse, ApplePayError };
