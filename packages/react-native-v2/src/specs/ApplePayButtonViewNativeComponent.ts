import type { HostComponent, ViewProps } from "react-native";
import { Int32 } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

export interface NativeProps extends ViewProps {
  red: Int32;
  green: Int32;
  blue: Int32;
}

export default codegenNativeComponent<NativeProps>(
  "ApplePayButtonView"
) as HostComponent<NativeProps>;
