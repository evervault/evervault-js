import { requireNativeComponent } from "react-native";
import { ApplePayButtonProps, NativeProps } from "./types";
export * from './types';

const NativeEvervaultPaymentView = requireNativeComponent<NativeProps>('EvervaultPaymentView');

export const isApplePayAvailable = () => {
  // TODO: Call the native method to check if Apple Pay is available
  return true;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
    appId,
    merchantId,
    supportedNetworks = ['visa', 'mastercard'],
    buttonType = 'buy',
    buttonTheme = 'automatic',
    transaction,
    onDidAuthorizePayment,
    onDidFinishWithResult,
    onPrepareTransaction,
    ...props
  }) => {
    return (
      <NativeEvervaultPaymentView
        config={{
          appId,
          merchantId,
          supportedNetworks,
          buttonType,
          buttonTheme,
        }}
        transaction={transaction}
        // TODO: Add handlers
        // onDidAuthorizePayment={onDidAuthorizePayment}
        // onDidFinishWithResult={onDidFinishWithResult}
        // onPrepareTransaction={onPrepareTransaction}
        {...props}
      />
    );
  };