import type { HostComponent, ViewProps } from "react-native";
import {
  DirectEventHandler,
  Int32,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export interface SummaryItem {
  label: string;
  amount: string;
}

export interface DateComponents {
  year: Int32;
  month: Int32;
  day: Int32;
}

export interface ShippingMethod extends SummaryItem {
  detail?: string;
  identifier?: string;
  dateRange?: {
    start: DateComponents;
    end: DateComponents;
  };
}

export interface Transaction {
  type?: WithDefault<"oneOff" | "disbursement" | "recurring", "oneOff">;
  country: string;
  currency: string;
  paymentSummaryItems: SummaryItem[];
  shippingType?: WithDefault<
    "shipping" | "delivery" | "servicePickup" | "storePickup",
    "shipping"
  >;
  shippingMethods?: ShippingMethod[];
  requiredShippingContactFields?: string[];
}

export interface AuthorizePaymentEvent {
  card: {
    brand: string | null;
    country: string | null;
    currency: string | null;
    funding: string | null;
    issuer: string | null;
    segment: string | null;
  };
  cryptogram: string;
  deviceManufacturerIdentifier: string;
  eci: Int32 | null;
  networkToken: {
    expiry: {
      month: Int32;
      year: Int32;
    };
    number: string;
    rawExpiry: string;
    tokenServiceProvider: string;
  };
  paymentDataType: string;
}

export interface FinishWithResultEvent {
  success: boolean;
  code: string;
  error: string;
}

export interface NativeProps extends ViewProps {
  appId: string;
  merchantId: string;
  transaction: Transaction;
  // https://developer.apple.com/documentation/passkit/pkpaymentnetwork
  supportedNetworks?: string[];
  // TODO: https://developer.apple.com/documentation/PassKit/PKPaymentButtonType
  buttonType?: WithDefault<
    "plain" | "buy" | "addMoney" | "book" | "checkout",
    "plain"
  >;
  // https://developer.apple.com/documentation/passkit/pkpaymentbuttonstyle
  buttonStyle?: WithDefault<
    "white" | "whiteOutline" | "black" | "automatic",
    "automatic"
  >;
  readonly onAuthorizePayment?: DirectEventHandler<AuthorizePaymentEvent>;
  readonly onFinishWithResult?: DirectEventHandler<FinishWithResultEvent>;
}

export type ButtonType = NonNullable<NativeProps["buttonType"]>;
export type ButtonStyle = NonNullable<NativeProps["buttonStyle"]>;

export default codegenNativeComponent<NativeProps>(
  "ApplePayButtonView"
) as HostComponent<NativeProps>;
