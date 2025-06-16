import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { CardBrandName, CardConfig, CardPayload } from "./types";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import { CardFormValues, getCardSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utils";
import { EvervaultInputContext, EvervaultInputContextValue } from "../Input";
import { z } from "zod";

const DEFAULT_ACCEPTED_BRANDS: CardBrandName[] = [];

export interface CardProps extends PropsWithChildren, CardConfig {
  /**
   * The default values to use for the form.
   */
  defaultValues?: {
    name?: string;
    number?: string;
    expiry?: string;
    cvc?: string;
  };

  /**
   * Triggered whenever the component's state is updated.
   */
  onChange?(payload: CardPayload): void;

  /**
   * Triggered when a native error occurs.
   */
  onError?(error: Error): void;

  /**
   * The validation mode to use for the form.
   *
   * - `onChange`: Validate the form when the user changes a field.
   * - `onBlur`: Validate the form when the user leaves a field.
   * - `onTouched`: Validate the form when the user touches a field.
   * - `all`: Validate the form when the user changes or leaves a field.
   *
   * @default "all"
   */
  validationMode?: "onChange" | "onBlur" | "onTouched" | "all";
}

export interface Card {
  /**
   * Resets the form to its default values and state.
   */
  reset(): void;
}

export const Card = forwardRef<Card, CardProps>(function Card(
  {
    children,
    defaultValues: cardDefaultValues,
    onChange,
    onError,
    acceptedBrands = DEFAULT_ACCEPTED_BRANDS,
    allow3DigitAmexCVC = true,
    validationMode = "all",
  },
  ref
) {
  const evervault = useEvervault();

  const schema = useMemo(() => {
    const card = getCardSchema({ acceptedBrands, allow3DigitAmexCVC });
    return z.object({ card });
  }, [acceptedBrands, allow3DigitAmexCVC]);

  const resolver = useMemo(() => {
    return zodResolver(schema);
  }, [schema]);

  const defaultValues = useMemo(
    () => ({
      card: cardDefaultValues,
    }),
    [cardDefaultValues]
  );

  const methods = useForm<{ card: CardFormValues }>({
    defaultValues,
    resolver,
    mode: validationMode,
    shouldUseNativeValidation: false,
  });

  const inputContext = useMemo<EvervaultInputContextValue>(
    () => ({
      validationMode,
    }),
    [validationMode]
  );

  // Use refs to prevent closures from being captured
  const onChangeRef = useRef<typeof onChange>(onChange);
  onChangeRef.current = onChange;
  const onErrorRef = useRef<typeof onError>(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!onChange) return;

    let abortController: AbortController | undefined;
    function handleChange(values: DeepPartial<{ card: CardFormValues }>) {
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      const signal = abortController.signal;

      requestAnimationFrame(async () => {
        try {
          const payload = await formatPayload(values, {
            encrypt: evervault.encrypt,
            form: methods,
            schema,
          });
          if (signal.aborted) return;
          onChangeRef.current?.(payload);
        } catch (error) {
          onErrorRef.current?.(error as Error);
        }
      });
    }

    handleChange(methods.getValues());
    const subscription = methods.watch(handleChange);
    return () => subscription.unsubscribe();
  }, [evervault.encrypt, schema, allow3DigitAmexCVC]);

  useImperativeHandle(
    ref,
    useCallback(
      () => ({
        reset() {
          methods.reset();
        },
      }),
      []
    )
  );

  return (
    <FormProvider {...methods}>
      <EvervaultInputContext.Provider value={inputContext}>
        {children}
      </EvervaultInputContext.Provider>
    </FormProvider>
  );
});
