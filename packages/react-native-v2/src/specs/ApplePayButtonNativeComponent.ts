import { HostComponent, ViewProps } from "react-native";
import { DirectEventHandler } from "react-native/Libraries/Types/CodegenTypes";
import codegenNativeComponent from "react-native/Libraries/Utilities/codegenNativeComponent";
import codegenNativeCommands from "react-native/Libraries/Utilities/codegenNativeCommands";
import React from "react";

const component =
  "default" in codegenNativeComponent
    ? (codegenNativeComponent.default as typeof codegenNativeComponent)
    : codegenNativeComponent;

const commands =
  "default" in codegenNativeCommands
    ? (codegenNativeCommands.default as typeof codegenNativeCommands)
    : codegenNativeCommands;

export interface NativeProps extends ViewProps {
  appId: string;
  merchantId: string;
  supportedNetworks: string[];
  paymentType: string;
  appearance: string;

  readonly onAuthorizePayment?: DirectEventHandler<{ data: string }>;
  readonly onError?: DirectEventHandler<{ data: string }>;
  readonly onPrepareTransaction: DirectEventHandler<{ data: string }>;
}

export type ApplePayButtonComponent = HostComponent<NativeProps>;

export interface NativeCommands {
  prepareTransaction: (
    ref: React.ElementRef<ApplePayButtonComponent>,
    transaction: string
  ) => void;
}

export const Commands = commands<NativeCommands>({
  supportedCommands: ["prepareTransaction"],
});

export default component<NativeProps>(
  "ApplePayButtonComponentView"
) as ApplePayButtonComponent;
