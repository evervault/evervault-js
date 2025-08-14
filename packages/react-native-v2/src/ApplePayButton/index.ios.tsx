import { requireNativeComponent } from "react-native";
import { ApplePayButtonProps } from "./types";
export * from './types';

const NativeEvervaultPaymentView = requireNativeComponent<ApplePayButtonProps>('EvervaultPaymentView');

export const isApplePayAvailable = () => {
  // TODO: Call the native method to check if Apple Pay is available
  return true;
}

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
    config,
    transaction,
    buttonType = 'pay',
    buttonTheme = 'automatic',
    allowedCardNetworks = ['VISA', 'MASTERCARD'],
    onDidAuthorizePayment,
    onDidFinishWithResult,
    onPrepareTransaction,
    ...props
  }) => {
    return (
      <NativeEvervaultPaymentView
        config={config}
        transaction={transaction}
        buttonType={buttonType}
        buttonTheme={buttonTheme}
        allowedCardNetworks={JSON.stringify(allowedCardNetworks)}
        onDidAuthorizePayment={onDidAuthorizePayment}
        onDidFinishWithResult={onDidFinishWithResult}
        onPrepareTransaction={onPrepareTransaction}
        {...props}
      />
    );
  };