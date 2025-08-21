import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import { HostComponent, type ViewProps } from "react-native";

export type ButtonType = 'book' | 'buy' | 'checkout' | 'donate' | 'order' | 'pay' | 'plain' | 'subscribe';
export type ButtonTheme = 'light' | 'dark';
export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
export type CardNetwork = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'JCB';

export type Amount = {
    value: string;
  };
  
  export type LineItem = {
    label: string;
    amount: string; //Amount;
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
    supportedNetworks: string[]; //CardNetwork[];
    supportedMethods: string[]; //AuthMethod[];
    buttonType: string; //ButtonType;
    buttonTheme: string; //ButtonTheme;
  };
  
export interface NativeProps extends ViewProps {
    config: Config;
    transaction: Transaction;
  }

export default codegenNativeComponent<NativeProps>('GooglePayButton') as HostComponent<NativeProps>;
