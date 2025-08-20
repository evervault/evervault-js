import { type ViewProps } from 'react-native';
import type { DirectEventHandler, Double, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';

export class Amount {
  public value: string;

  constructor(value: string) {
    this.value = value;
  }
};

export type SummaryItem = {
  label: string;
  amount: Amount;
};

export type OneOffTransaction = {
  currency: string;
  country: string;
  paymentSummaryItems: SummaryItem[];
  // TODO: Add other fields
}

export type RecurringTransaction = {
  // TODO: Add other fields
};

export type DisbursementTransaction = {
  // TODO: Add other fields
};

export type Transaction = OneOffTransaction | RecurringTransaction | DisbursementTransaction;

export type Config = {
  appId: string;
  merchantId: string;
  supportedNetworks: CardNetwork[];
  buttonType: string;
  buttonTheme: string;
};

export type ApplePayNetworkTokenExpiry = {
  month: string;
  year: string;
}

export type ApplePayNetworkToken = {
  number: string;
  expiry: ApplePayNetworkTokenExpiry;
  rawExpiry: string;
  tokenServiceProvider: string;
};

export type ApplePayCard = {
  brand?: string;
  funding?: string;
  segment?: string;
  country?: string;
  currency?: string;
  issuer?: string;
};

export type ApplePayResponse = {
  networkToken: ApplePayNetworkToken;
  card: ApplePayCard;
  cryptogram: string;
  eci?: string;
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
}

export type ButtonType = 'plain' | 'book' | 'buy' | 'checkout' | 'order' | 'subscribe' | 'pay' | 'in_store' | 'donate' | 'reload' | 'add_money' | 'top_up' | 'rent' | 'support' | 'contribute' | 'tip' | 'continue';
export type ButtonTheme = 'automatic' | 'white' | 'white_outline' | 'black';
export type AuthMethod = 'PAN_ONLY' | 'CRYPTOGRAM_3DS';
export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb';

export interface NativeProps extends ViewProps {
  config: Config;
  transaction: Transaction;
  onDidAuthorizePayment?: DirectEventHandler<{
    networkToken: {
      number: string;
      expiry: { month: string; year: string };
      rawExpiry: string;
      tokenServiceProvider: string;
    };
    card: {
      brand?: string;
      funding?: string;
      segment?: string;
      country?: string;
      currency?: string;
      issuer?: string;
    };
    cryptogram: string;
    eci?: string;
    paymentDataType: string;
    deviceManufacturerIdentifier: string;
  }>;
  onDidFinishWithResult?: DirectEventHandler<{ success: boolean; error?: string }>;
  onPrepareTransaction?: DirectEventHandler<null>;
}

export type ApplePayButtonProps = {
    appId: string;
    merchantId: string;
    buttonType?: ButtonType;
    buttonTheme?: ButtonTheme;
    supportedNetworks?: CardNetwork[];
    transaction: Transaction;
    onDidAuthorizePayment?: (data: ApplePayResponse) => void;
    onDidFinishWithResult?: (data: { success: boolean; error?: string }) => void;
    onPrepareTransaction?: (data: Transaction) => void;

    // TODO: Add shipping callback methods.
  };
