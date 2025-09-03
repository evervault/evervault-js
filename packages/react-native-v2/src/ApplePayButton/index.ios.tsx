import { useCallback } from "react";
import ApplePayButtonNativeComponent, {
  NativeProps,
} from "../specs/ApplePayButtonNativeComponent";
import { useEvervault } from "../useEvervault";
import { ApplePayButtonProps, ApplePayResponse, Result } from "./types";

export function ApplePayButton({
  merchantId,
  supportedNetworks = [],
  paymentType = "plain",
  appearance = "automatic",
  onAuthorizePayment,
  onFinishWithResult,
  ...props
}: ApplePayButtonProps) {
  const evervault = useEvervault();

  const handleAuthorizePayment = useCallback<
    NonNullable<NativeProps["onAuthorizePayment"]>
  >(
    (event) => {
      const response = JSON.parse(event.nativeEvent.data) as ApplePayResponse;
      onAuthorizePayment?.(response);
    },
    [onAuthorizePayment]
  );

  const handleFinishWithResult = useCallback<
    NonNullable<NativeProps["onFinishWithResult"]>
  >(
    (event) => {
      const result = JSON.parse(event.nativeEvent.data) as Result<void, string>;
      onFinishWithResult?.(result);
    },
    [onFinishWithResult]
  );

  return (
    <ApplePayButtonNativeComponent
      appId={evervault.appId}
      merchantId={merchantId}
      supportedNetworks={supportedNetworks}
      paymentType={paymentType}
      appearance={appearance}
      onAuthorizePayment={handleAuthorizePayment}
      onFinishWithResult={handleFinishWithResult}
      {...props}
    />
  );
}

export * from "./types";
