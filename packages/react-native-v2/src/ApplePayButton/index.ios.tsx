import {
  ApplePayButtonProps,
  ApplePayError,
  supportedNetworkMap,
} from "./types";
import ApplePayButtonView, {
  AuthorizePaymentEvent,
  FinishWithResultEvent,
} from "../specs/ApplePayButtonViewNativeComponent";
import { Fragment } from "react/jsx-runtime";
import { NativeSyntheticEvent, Text } from "react-native";
import { useCallback, useMemo } from "react";

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
  onFinishWithResult,
  onAuthorizePayment,
  ...props
}) => {
  const handleFinishWithResult = useCallback(
    (evt: NativeSyntheticEvent<FinishWithResultEvent>) => {
      if (evt.nativeEvent.success) {
        onFinishWithResult?.({ success: true });
      } else {
        onFinishWithResult?.({
          success: false,
          code: evt.nativeEvent.code as ApplePayError,
          error: evt.nativeEvent.error,
        });
      }
    },
    [onFinishWithResult]
  );

  const handleAuthorizePayment = useCallback(
    (evt: NativeSyntheticEvent<AuthorizePaymentEvent>) => {
      onAuthorizePayment?.(evt.nativeEvent);
    },
    [onAuthorizePayment]
  );

  const parsedNetworks = useMemo(() => {
    return supportedNetworks.flatMap(
      (network) => supportedNetworkMap[network] ?? []
    );
  }, [supportedNetworks]);

  return (
    <ApplePayButtonView
      {...props}
      supportedNetworks={parsedNetworks}
      onFinishWithResult={handleFinishWithResult}
      onAuthorizePayment={handleAuthorizePayment}
    />
  );
};

export * from "./types";
