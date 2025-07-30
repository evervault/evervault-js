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
  buttonTheme?: WithDefault<ButtonTheme, 'white'>;
  borderRadius?: number;
  allowedCardNetworks?: CardNetwork[];
};

const NativeEvervaultPaymentView = requireNativeComponent('EvervaultPaymentView');

export const EvervaultPaymentView: React.FC<EvervaultPaymentViewProps> = ({
  config,
  transaction,
  buttonType = 'pay',
  buttonTheme = 'black',
  borderRadius = 4,
  allowedCardNetworks = ['VISA', 'MASTERCARD'],
  ...props
}) => {
  return (
    <NativeEvervaultPaymentView
      config={config}
      transaction={transaction}
      buttonType={buttonType}
      buttonTheme={buttonTheme}
      borderRadius={borderRadius}
      allowedCardNetworks={JSON.stringify(allowedCardNetworks)}
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
