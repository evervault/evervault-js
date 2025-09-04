import { HostComponent, ViewProps } from "react-native";
import { DirectEventHandler } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export interface NativeProps extends ViewProps {
  appId: string;
  merchantId: string;
  supportedNetworks: string[];
  paymentType: string;
  appearance: string;

  readonly onAuthorizePayment?: DirectEventHandler<{ data: string }>;
  readonly onError?: DirectEventHandler<{ data: string }>;
}

export type ApplePayButtonComponent = HostComponent<NativeProps>;

export default codegenNativeComponent<NativeProps>(
  "ApplePayButtonComponentView"
) as ApplePayButtonComponent;
