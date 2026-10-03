import * as React from "react";
import { useEffect, useMemo, useRef, useImperativeHandle } from "react";
import EvervaultClient from "@evervault/browser";
import { useEvInstance } from "../../useEvInstance";
import type { CardProps, CardRef } from "./Card";

type CardInstance = ReturnType<EvervaultClient["ui"]["card"]>;

export const OptionsCard = React.forwardRef(function OptionsCard(
  {
    colorScheme,
    theme,
    icons,
    fields,
    autoFocus,
    translations,
    onSwipe,
    onReady,
    onError,
    onChange,
    onComplete,
    onValidate,
    onFocus,
    onBlur,
    onKeyUp,
    onKeyDown,
    autoComplete,
    autoProgress,
    acceptedBrands,
    defaultValues,
    redactCVC,
    allow3DigitAmexCVC,
    validation,
    customBrands,
    agentTools,
    preload,
  }: CardProps,
  forwardedRef: React.ForwardedRef<CardRef>
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inst = useRef<CardInstance | null>(null);

  useImperativeHandle(
    forwardedRef,
    () => {
      return {
        validate: () => {
          inst.current?.validate();
        },
        show: () => {
          inst.current?.show();
        },
      };
    },
    []
  );

  const config = useMemo(
    () => ({
      colorScheme,
      theme,
      icons,
      fields,
      autoFocus,
      translations,
      autoComplete,
      autoProgress,
      acceptedBrands,
      defaultValues,
      redactCVC,
      allow3DigitAmexCVC,
      validation,
      customBrands,
      agentTools,
    }),
    [
      colorScheme,
      theme,
      icons,
      translations,
      fields,
      autoFocus,
      autoComplete,
      autoProgress,
      acceptedBrands,
      defaultValues,
      redactCVC,
      allow3DigitAmexCVC,
      validation,
      customBrands,
      agentTools,
    ]
  );

  const instance = useEvInstance({
    onMount(evervault) {
      if (!ref.current) return;
      const inst = evervault.ui.card(config);
      if (preload) {
        inst.preload(ref.current);
      } else {
        inst.mount(ref.current);
      }
      return inst;
    },
    onUpdate(instance) {
      instance.update(config);
    },
    onMountError: onError,
  });

  inst.current = instance;

  // setup ready event listener
  useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  // setup error event listener
  useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  // setup swipe event listener
  useEffect(() => {
    if (!instance || !onSwipe) return undefined;
    return instance?.on("swipe", onSwipe);
  }, [instance, onSwipe]);

  // setup change event listener
  useEffect(() => {
    if (!instance || !onChange) return undefined;
    return instance?.on("change", onChange);
  }, [instance, onChange]);

  // setup complete event listener
  useEffect(() => {
    if (!instance || !onComplete) return undefined;
    return instance?.on("complete", onComplete);
  }, [instance, onComplete]);

  // setup focus event listener
  useEffect(() => {
    if (!instance || !onFocus) return undefined;
    return instance?.on("focus", onFocus);
  }, [instance, onFocus]);

  // setup blur event listener
  useEffect(() => {
    if (!instance || !onBlur) return undefined;
    return instance?.on("blur", onBlur);
  }, [instance, onBlur]);

  // setup keyup event listener
  useEffect(() => {
    if (!instance || !onKeyUp) return undefined;
    return instance?.on("keyup", onKeyUp);
  }, [instance, onKeyUp]);

  // setup keydown event listener
  useEffect(() => {
    if (!instance || !onKeyDown) return undefined;
    return instance?.on("keydown", onKeyDown);
  }, [instance, onKeyDown]);

  // setup validate event listener
  useEffect(() => {
    if (!instance || !onValidate) return undefined;
    return instance?.on("validate", onValidate);
  }, [instance, onValidate]);

  return <div ref={ref} />;
});
