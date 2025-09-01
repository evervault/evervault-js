import type { HostComponent, ViewProps } from "react-native";
import {
  DirectEventHandler,
  Int32,
} from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";

type RedChangeEvent = {
  red: Int32;
};

export interface NativeProps extends ViewProps {
  red: Int32;
  green: Int32;
  blue: Int32;
  readonly onRedChange?: DirectEventHandler<RedChangeEvent>;
}

export default codegenNativeComponent<NativeProps>(
  "ApplePayButtonView"
) as HostComponent<NativeProps>;
