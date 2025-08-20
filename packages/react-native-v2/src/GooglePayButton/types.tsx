import { ViewProps } from "react-native";
import { DirectEventHandler, WithDefault } from "react-native/Libraries/Types/CodegenTypes";

export type Amount = {
  value: string;
};

export type LineItem = {
  label: string;
  amount: Amount;
};

export type Transaction = {
  currency: string;
  country: string;
  total: string;
  lineItems: LineItem[];
};

export type Config = {
  appId: string;
  merchantId: string;
  supportedNetworks: CardNetwork[];
  supportedMethods: AuthMethod[];
  buttonType: ButtonType;
  buttonTheme: ButtonTheme;
};

export type ButtonType = 'book' | 'buy' | 'checkout' | 'donate' | 'order' | 'pay' | 'plain' | 'subscribe';
export type ButtonTheme = 'light' | 'dark';
export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';

export interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
}

export type GooglePayButtonProps = Config & {
    transaction: Transaction;
    // TODO: Add shipping callback methods.
};
