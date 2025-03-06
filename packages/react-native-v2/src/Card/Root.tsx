import { PropsWithChildren, useEffect, useMemo } from "react";
import { CardConfig, CardPayload } from "./types";
import { FormProvider, useForm } from "react-hook-form";
import { CardFormValues, cardFormSchema } from "./schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEvervault } from "../useEvervault";
import { formatPayload } from "./utilities";

export interface CardProps extends PropsWithChildren, CardConfig {
  initialValue?: Partial<CardFormValues>;
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
    () => ({ ...initialValue, acceptedBrands }),
    [initialValue, acceptedBrands]
  );

  const methods = useForm<CardFormValues>({
    defaultValues,
    resolver: zodResolver(cardFormSchema),
  });

  useEffect(() => {
    if (!evervault.ready) return;
    if (!onChange) return;

    const subscription = methods.watch(async (values) => {
      const payload = await formatPayload(values, methods);
      onChange(payload);
    });

    return subscription.unsubscribe;
  }, [methods, onChange]);

  return <FormProvider {...methods}>{children}</FormProvider>;
}
