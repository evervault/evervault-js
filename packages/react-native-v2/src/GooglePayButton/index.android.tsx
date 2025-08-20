import { requireNativeComponent } from "react-native";
import { WithDefault } from "react-native/Libraries/Types/CodegenTypes";
import { ButtonTheme, ButtonType, CardNetwork, Config, Transaction, GooglePayButtonProps } from "./types";
export * from './types';

const NativeEvervaultPaymentView = requireNativeComponent('EvervaultPaymentView');

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
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

export const isGooglePayAvailable = () => {
  // TODO: Call the native method to check if Google Pay is available
  return true;
}
