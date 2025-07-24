import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { ViewProps } from 'react-native';
import type { DirectEventHandler } from 'react-native/Libraries/Types/CodegenTypes';

type LineItem = {
  label: string;
  amount: string;
};

type Transaction = {
  country: string;
  currency: string;
  total: string;
  lineItems: LineItem[];
};

interface NativeProps extends ViewProps {
  transaction: Transaction;
}

export default codegenNativeComponent<NativeProps>(
  'EvervaultPaymentView'
);