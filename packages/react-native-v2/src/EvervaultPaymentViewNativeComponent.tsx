import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

export type LineItem = {
  label: string;
  amount: Double;
  quantity: Double;
};

export type Transaction = {
  amount: Double;
  currency: string;
  country: string;
  merchantId: string;
  lineItems?: LineItem[];
};

export type Config = {
  appId: string;
  merchantId: string;
};

export type ButtonType = 'plain' | 'book' | 'buy' | 'checkout' | 'order' | 'subscribe' | 'pay';
export type ButtonTheme = 'white' | 'black';
export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB' | 'INTERAC';

export interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  buttonType?: WithDefault<ButtonType, 'pay'>;
  buttonTheme?: WithDefault<ButtonTheme, 'white'>;
  borderRadius?: Double;
  allowedCardNetworks?: WithDefault<CardNetwork[], '["VISA","MASTERCARD"]'>;
  onSuccess?: DirectEventHandler<null>;
  onError?: DirectEventHandler<{ error: string }>;
  onCancel?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>(
  'EvervaultPaymentView'
);