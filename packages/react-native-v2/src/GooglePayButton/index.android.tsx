import { GooglePayButtonProps } from "./types";
import NativeGooglePayButton from '../specs/GooglePayButtonNativeComponent';
export * from './types';

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
    <NativeGooglePayButton
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
