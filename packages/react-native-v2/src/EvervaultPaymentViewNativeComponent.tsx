import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { DirectEventHandler, Double } from 'react-native/Libraries/Types/CodegenTypes';

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

// Convert enums to string literal types for codegen compatibility
export type ButtonType = 'plain' | 'book' | 'buy' | 'checkout' | 'order' | 'subscribe' | 'pay';

export type ButtonTheme = 'white' | 'black';

export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';

export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB' | 'INTERAC';

// Keep the enum objects for backward compatibility in the public API
export const ButtonType = {
  PLAIN: 'plain' as ButtonType,
  BOOK: 'book' as ButtonType,
  BUY: 'buy' as ButtonType,
  CHECKOUT: 'checkout' as ButtonType,
  ORDER: 'order' as ButtonType,
  SUBSCRIBE: 'subscribe' as ButtonType,
  PAY: 'pay' as ButtonType,
} as const;

export const ButtonTheme = {
  WHITE: 'white' as ButtonTheme,
  BLACK: 'black' as ButtonTheme,
} as const;

export const AuthMethod = {
  PAN_ONLY: 'PAN_ONLY' as AuthMethod,
  CRYPTOGRAM_3DS: 'CRYPTOGRAM_3DS' as AuthMethod,
} as const;

export const CardNetwork = {
  VISA: 'VISA' as CardNetwork,
  MASTERCARD: 'MASTERCARD' as CardNetwork,
  AMEX: 'AMEX' as CardNetwork,
  DISCOVER: 'DISCOVER' as CardNetwork,
  JCB: 'JCB' as CardNetwork,
  INTERAC: 'INTERAC' as CardNetwork,
} as const;

export interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  buttonType: ButtonType;
  buttonTheme: ButtonTheme;
  borderRadius?: number;
  allowedAuthMethods?: AuthMethod[];
  allowedCardNetworks?: CardNetwork[];
  onSuccess?: DirectEventHandler<null>;
  onError?: DirectEventHandler<{ error: string }>;
  onCancel?: DirectEventHandler<null>;
}

export default codegenNativeComponent<NativeProps>(
  'EvervaultPaymentView'
);