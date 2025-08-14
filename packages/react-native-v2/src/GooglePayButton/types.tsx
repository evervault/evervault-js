import { ViewProps } from "react-native";
import { DirectEventHandler, WithDefault } from "react-native/Libraries/Types/CodegenTypes";

export type LineItem = {
  label: string;
  amount: string;
};

export type Transaction = {
  total: string;
  currency: string;
  country: string;
  lineItems?: LineItem[];
};

export type Config = {
  appId: string;
  merchantId: string;
};

export type ButtonType = 'plain' | 'book' | 'buy' | 'checkout' | 'order' | 'subscribe' | 'pay';
export type ButtonTheme = 'light' | 'dark' | 'automatic';
export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';

interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  buttonType?: WithDefault<ButtonType, 'pay'>;
  buttonTheme?: WithDefault<ButtonTheme, 'automatic'>;
  allowedCardNetworks?: string;
  onDidAuthorizePayment?: DirectEventHandler<{
    networkToken: {
      number: string;
      expiry: { month: string; year: string };
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
  }>;
  onDidFinishWithResult?: DirectEventHandler<{ success: boolean; error?: string }>;
  onPrepareTransaction?: DirectEventHandler<null>;
}

export type GooglePayButtonProps = {
    config: Config;
    transaction: Transaction;
    buttonType?: WithDefault<ButtonType, 'pay'>;
    buttonTheme?: WithDefault<ButtonTheme, 'automatic'>;
    allowedCardNetworks?: CardNetwork[];
    onDidAuthorizePayment?: (data: any) => void;
    onDidFinishWithResult?: (data: { success: boolean; error?: string }) => void;
    onPrepareTransaction?: () => void;
  };
