import {
  ApplePayButtonProps,
  ApplePayError,
  supportedNetworkMap,
} from "./types";
import ApplePayButtonView, {
  AuthorizePaymentEvent,
  DateComponents,
  FinishWithResultEvent,
} from "../specs/ApplePayButtonViewNativeComponent";
import { NativeSyntheticEvent, Text } from "react-native";
import { useCallback, useMemo } from "react";
import { toDateComponents } from "./utilities";

export const isApplePayAvailable = () => {
  // TODO: Call the native method to check if Apple Pay is available
  return true;
};

export const isApplePayDisbursementAvailable = () => {
  // TODO: Call the native method to check if Apple Pay Disbursement is available
  return false;
};

export const ApplePayButton: React.FC<ApplePayButtonProps> = ({
  transaction,
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

  const preparedNetworks = useMemo(() => {
    return supportedNetworks.flatMap(
      (network) => supportedNetworkMap[network] ?? []
    );
  }, [supportedNetworks]);

  const preparedTransaction = useMemo(() => {
    return {
      ...transaction,
      shippingMethods: transaction.shippingMethods?.map((method) => {
        const dateRange = method.dateRange
          ? {
              start: toDateComponents(method.dateRange.start),
              end: toDateComponents(method.dateRange.end),
            }
          : undefined;

        return {
          ...method,
          dateRange,
        };
      }),
    };
  }, [transaction]);

  return (
    <ApplePayButtonView
      {...props}
      transaction={preparedTransaction}
      supportedNetworks={preparedNetworks}
      onFinishWithResult={handleFinishWithResult}
      onAuthorizePayment={handleAuthorizePayment}
    />
  );
};

export * from "./types";
