import { ApplePayButtonProps, FinishWithResultEvent } from "./types";
import ApplePayButtonView from "../specs/ApplePayButtonViewNativeComponent";
import { Fragment } from "react/jsx-runtime";
import { NativeSyntheticEvent, Text } from "react-native";
import { useCallback } from "react";
export * from "./types";

export const isApplePayAvailable = () => {
  // TODO: Call the native method to check if Apple Pay is available
  return true;
};

export const isApplePayDisbursementAvailable = () => {
  // TODO: Call the native method to check if Apple Pay Disbursement is available
  return false;
};

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  supportedNetworks = [],
  buttonType = "plain",
  buttonStyle = "automatic",
  onFinishWithResult,
  ...props
}) => {
  const handleFinishWithResult = useCallback(
    (evt: NativeSyntheticEvent<FinishWithResultEvent>) => {
      if (evt.nativeEvent.success) {
        onFinishWithResult?.({ success: true });
      } else {
        onFinishWithResult?.({ success: false, error: evt.nativeEvent.error });
      }
    },
    [onFinishWithResult]
  );

  return (
    <Fragment>
      <Text>Hello World</Text>
      <ApplePayButtonView
        {...props}
        supportedNetworks={supportedNetworks}
        buttonType={buttonType}
        buttonStyle={buttonStyle}
        onFinishWithResult={handleFinishWithResult}
      />
    </Fragment>
  );
};
