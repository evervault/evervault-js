import type { HostComponent, ViewProps } from "react-native";
import {
  DirectEventHandler,
  Int32,
  WithDefault,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

type RedChangeEvent = {
  red: Int32;
};

export interface NativeProps extends ViewProps {
  appId: string;
  merchantId: string;
  // https://developer.apple.com/documentation/passkit/pkpaymentnetwork
  supportedNetworks?: string[];
  // TODO: https://developer.apple.com/documentation/PassKit/PKPaymentButtonType
  buttonType?: WithDefault<
    "plain" | "buy" | "addMoney" | "book" | "checkout",
    "plain"
  >;
  // https://developer.apple.com/documentation/passkit/pkpaymentbuttonstyle
  buttonStyle?: WithDefault<
    "white" | "whiteOutline" | "black" | "automatic",
    "automatic"
  >;
  readonly onRedChange?: DirectEventHandler<RedChangeEvent>;
}

export type ButtonType = NonNullable<NativeProps["buttonType"]>;
export type ButtonStyle = NonNullable<NativeProps["buttonStyle"]>;

export default codegenNativeComponent<NativeProps>(
  "ApplePayButtonView"
) as HostComponent<NativeProps>;
