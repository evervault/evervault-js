import { HostComponent, ViewProps } from "react-native";
import { DirectEventHandler } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "jcb";

export class Amount {
  public value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export type SummaryItem = {
  label: string;
  amount: string; //Amount;
};

export type OneOffTransaction = {
  currency: string;
  country: string;
  paymentSummaryItems: SummaryItem[];
  // TODO: Add other fields
};

export type RecurringTransaction = {
  // TODO: Add other fields
};

export type DisbursementTransaction = {
  // TODO: Add other fields
};

export type Transaction = OneOffTransaction; //| RecurringTransaction | DisbursementTransaction;

export type Config = {
  appId: string;
  merchantId: string;
  supportedNetworks: string[]; //WithDefault<CardNetwork, 'visa'>[];
  buttonType: string;
  buttonTheme: string;
};

export type ApplePayResponse = {
  networkToken: {
    number: string;
    expiry: {
      month: string;
      year: string;
    };
    rawExpiry: string;
    tokenServiceProvider: string;
  };
  card: {
    brand?: string;
    funding?: string;
    segment?: string;
    country?: string;
    currency?: string;
    issuer?: string;
  };
  cryptogram: string;
  eci?: string;
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
};

export type ApplePayNetworkToken = ApplePayResponse["networkToken"];
export type ApplePayCard = ApplePayResponse["card"];

export interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  onDidAuthorizePayment?: DirectEventHandler<ApplePayResponse>;
  onDidFinishWithResult?: DirectEventHandler<{
    success: boolean;
    error?: string;
  }>;
  onPrepareTransaction?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>("ApplePayButton", {
  excludedPlatforms: ["android"],
}) as HostComponent<NativeProps>;
