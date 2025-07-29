import React from 'react';
import { requireNativeComponent, ViewProps } from 'react-native';
import { 
  Config, 
  Transaction, 
  ButtonType, 
  ButtonTheme, 
  AuthMethod, 
  CardNetwork 
} from './EvervaultPaymentViewNativeComponent';

interface EvervaultPaymentViewProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  buttonType?: ButtonType;
  buttonTheme?: ButtonTheme;
  borderRadius?: number;
  allowedAuthMethods?: AuthMethod[];
  allowedCardNetworks?: CardNetwork[];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

const NativeEvervaultPaymentView = requireNativeComponent('EvervaultPaymentView');

export const EvervaultPaymentView: React.FC<EvervaultPaymentViewProps> = ({
  config,
  transaction,
  buttonType = ButtonType.PAY,
  buttonTheme = ButtonTheme.BLACK,
  borderRadius = 4,
  allowedAuthMethods = [AuthMethod.PAN_ONLY, AuthMethod.CRYPTOGRAM_3DS],
  allowedCardNetworks = [CardNetwork.VISA, CardNetwork.MASTERCARD],
  onSuccess,
  onError,
  onCancel,
  ...props
}) => {
  return (
    <NativeEvervaultPaymentView
      config={config}
      transaction={transaction}
      buttonType={buttonType}
      buttonTheme={buttonTheme}
      borderRadius={borderRadius}
      allowedAuthMethods={allowedAuthMethods}
      allowedCardNetworks={allowedCardNetworks}
      onSuccess={onSuccess}
      onError={onError}
      onCancel={onCancel}
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