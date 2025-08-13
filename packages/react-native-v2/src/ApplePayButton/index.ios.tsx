import { requireNativeComponent } from "react-native";
import { EvervaultPaymentViewProps } from "./types";
export * from './types';

const NativeEvervaultPaymentView = requireNativeComponent<EvervaultPaymentViewProps>('EvervaultPaymentView');

export const ApplePayButton: React.FC<EvervaultPaymentViewProps> = ({
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