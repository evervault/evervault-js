import React from 'react';
import { requireNativeComponent, ViewProps } from 'react-native';
import { 
  Config, 
  Transaction, 
  ButtonType, 
  ButtonTheme, 
  AuthMethod, 
  CardNetwork, 
  NativeProps
} from './EvervaultPaymentViewNativeComponent';
import { WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

type EvervaultPaymentViewProps = {
  config: Config;
  transaction: Transaction;
  buttonType?: WithDefault<ButtonType, 'pay'>;
  buttonTheme?: WithDefault<ButtonTheme, 'automatic'>;
  borderRadius?: number;
  allowedCardNetworks?: CardNetwork[];
  onDidAuthorizePayment?: (data: any) => void;
  onDidFinishWithResult?: (data: { success: boolean; error?: string }) => void;
  onPrepareTransaction?: () => void;
};

const NativeEvervaultPaymentView = requireNativeComponent('EvervaultPaymentView');

export const EvervaultPaymentView: React.FC<EvervaultPaymentViewProps> = ({
  config,
  transaction,
  buttonType = 'pay',
  buttonTheme = 'automatic',
  borderRadius = 4,
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
      borderRadius={borderRadius}
      allowedCardNetworks={allowedCardNetworks}
      onDidAuthorizePayment={onDidAuthorizePayment}
      onDidFinishWithResult={onDidFinishWithResult}
      onPrepareTransaction={onPrepareTransaction}
      {...props}
    />
  );
};

export type {
  Config,
  Transaction,
  ButtonType,
  ButtonTheme,
  AuthMethod,
  CardNetwork
};
