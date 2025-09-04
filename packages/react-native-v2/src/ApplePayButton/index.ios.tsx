import { useCallback } from "react";
import ApplePayButtonNativeComponent, {
  NativeProps,
} from "../specs/ApplePayButtonNativeComponent";
import { useEvervault } from "../useEvervault";
import { ApplePayButtonProps } from "./types";
import { responseSchema, errorSchema } from "./schema";

export function ApplePayButton({
  merchantId,
  supportedNetworks = [],
  paymentType = "plain",
  appearance = "automatic",
  onAuthorizePayment,
  onError,
  ...props
}: ApplePayButtonProps) {
  const evervault = useEvervault();

  const handleAuthorizePayment = useCallback<
    NonNullable<NativeProps["onAuthorizePayment"]>
  >(
    (event) => {
      const json = JSON.parse(event.nativeEvent.data);
      const response = responseSchema.safeParse(json);
      if (response.success) {
        onAuthorizePayment?.(response.data);
      }
    },
    [onAuthorizePayment]
  );

  const handleError = useCallback<NonNullable<NativeProps["onError"]>>(
    (event) => {
      const json = JSON.parse(event.nativeEvent.data);
      const error = errorSchema.safeParse(json);
      if (error.success) {
        onError?.(error.data);
      }
    },
    [onError]
  );

  return (
    <ApplePayButtonNativeComponent
      appId={evervault.appId}
      merchantId={merchantId}
      supportedNetworks={supportedNetworks}
      paymentType={paymentType}
      appearance={appearance}
      onAuthorizePayment={handleAuthorizePayment}
      onError={handleError}
      {...props}
    />
  );
}

export * from "./types";
