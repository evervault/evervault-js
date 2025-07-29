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

type EvervaultPaymentViewProps = NativeProps;

const NativeEvervaultPaymentView = requireNativeComponent('EvervaultPaymentView');

export const EvervaultPaymentView: React.FC<EvervaultPaymentViewProps> = ({
  config,
  transaction,
  buttonType = 'pay',
  buttonTheme = 'black',
  borderRadius = 4,
  allowedCardNetworks = ['VISA', 'MASTERCARD'],
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
