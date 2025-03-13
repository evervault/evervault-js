import {
  forwardRef,
  PropsWithChildren,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import { CardBrandName, CardConfig, CardPayload } from "./types";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import { CardFormValues, cardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utils";

const DEFAULT_ACCEPTED_BRANDS: CardBrandName[] = [];

const cardFormResolver = zodResolver(cardFormSchema);

export interface CardProps extends PropsWithChildren, CardConfig {
  initialValue?: {
    cvc?: string;
    expiry?: string;
    name?: string;
    number?: string;
  };
  onChange?(payload: CardPayload | null): void;
}

export interface Card {
  reset(): void;
}

export const Card = forwardRef<Card, CardProps>(function Card(
  {
    children,
    initialValue,
    onChange,
    acceptedBrands = DEFAULT_ACCEPTED_BRANDS,
  },
  ref
) {
  const evervault = useEvervault();

  const defaultValues = useMemo(
    () => ({
      ...initialValue,
      acceptedBrands,
    }),
    [initialValue, acceptedBrands]
  );

  const methods = useForm<CardFormValues>({
    defaultValues,
    resolver: cardFormResolver,
    mode: "all",
    shouldUseNativeValidation: false,
  });

  useEffect(() => {
    methods.setValue("acceptedBrands", acceptedBrands);
  }, [acceptedBrands]);

  useEffect(() => {
    if (!evervault.ready) return;
    if (!onChange) return;

    let abortController: AbortController | undefined;
    function handleChange(values: DeepPartial<CardFormValues>) {
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      const signal = abortController.signal;

      requestAnimationFrame(async () => {
        const payload = await formatPayload(values, methods);
        if (signal.aborted) return;
        onChange?.(payload);
      });
    }

    handleChange(methods.getValues());
    const subscription = methods.watch(handleChange);
    return () => subscription.unsubscribe();
  }, [evervault.ready, onChange]);

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

  return <FormProvider {...methods}>{children}</FormProvider>;
});
