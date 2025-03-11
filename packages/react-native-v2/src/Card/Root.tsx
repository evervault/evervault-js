import { PropsWithChildren, useEffect, useMemo } from "react";
import { CardConfig, CardPayload } from "./types";
import { DeepPartial, FormProvider, useForm } from "react-hook-form";
import { CardFormValues, cardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utilities";

const cardFormResolver = zodResolver(cardFormSchema);

export interface CardProps extends PropsWithChildren, CardConfig {
  initialValue?: {
    cvc?: string;
    expiry?: string;
    name?: string;
    number?: string;
  };
  onChange?(payload: CardPayload): void;
}

export function Card({
  children,
  initialValue,
  onChange,
  acceptedBrands = [],
}: CardProps) {
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
    if (!evervault.ready) return;
    if (!onChange) return;

    let abortController: AbortController | undefined;
    const subscription = methods.watch((values) => {
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
    });

    return subscription.unsubscribe;
  }, [evervault.ready, methods, onChange]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
