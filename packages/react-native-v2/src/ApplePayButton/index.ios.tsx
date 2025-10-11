import { ElementRef, useCallback, useRef } from "react";
import ApplePayButtonNativeComponent, {
  ApplePayButtonComponent,
  Commands,
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
  onPrepareTransaction,
  ...props
}: ApplePayButtonProps) {
  const ref = useRef<ElementRef<ApplePayButtonComponent> | null>(null);

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

  const handlePrepareTransaction = useCallback<
    NonNullable<NativeProps["onPrepareTransaction"]>
  >(async () => {
    const view = ref.current;
    if (!view) return;
    const transaction = await onPrepareTransaction();
    const json = JSON.stringify(transaction);
    Commands.prepareTransaction(view, json);
  }, [onPrepareTransaction]);

  return (
    <ApplePayButtonNativeComponent
      ref={ref}
      appId={evervault.appId}
      merchantId={merchantId}
      supportedNetworks={supportedNetworks}
      paymentType={paymentType}
      appearance={appearance}
      onAuthorizePayment={handleAuthorizePayment}
      onError={handleError}
      onPrepareTransaction={handlePrepareTransaction}
      {...props}
    />
  );
}

export * from "./types";
