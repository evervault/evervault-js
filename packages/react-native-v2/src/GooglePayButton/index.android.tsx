import { requireNativeComponent } from "react-native";
import { GooglePayButtonProps, NativeProps } from "./types";
export * from './types';

const NativeEvervaultPaymentView = requireNativeComponent<NativeProps>('EvervaultPaymentView');

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  appId,
  merchantId,
  supportedNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER', 'JCB'],
  supportedMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
  transaction,
  buttonType = 'pay',
  buttonTheme = 'dark',
  ...props
}) => {
  return (
    <NativeEvervaultPaymentView
      config={{
        appId,
        merchantId,
        supportedNetworks,
        supportedMethods,
        buttonType,
        buttonTheme,
      }}
      transaction={transaction}
      {...props}
    />
  );
};

export const isGooglePayAvailable = () => {
  // TODO: Call the native method to check if Google Pay is available
  return true;
}
