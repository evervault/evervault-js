import * as React from "react";
import { useEffect, useMemo, useRef } from "react";
import type {
  CardBrandName,
  CardField,
  CardIcons,
  CardOptions,
  CardPayload,
  CardTranslations,
  FieldEvent,
  SwipedCard,
  ThemeDefinition,
} from "types";
import { useEvInstance } from "../useEvInstance";

export interface CardProps {
  autoFocus?: boolean;
  theme?: ThemeDefinition;
  icons?: boolean | CardIcons;
  translations?: CardTranslations;
  fields?: CardField[];
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCard) => void;
  onChange?: (data: CardPayload) => void;
  onComplete?: (data: CardPayload) => void;
  autoComplete?: CardOptions["autoComplete"];
  autoProgress?: boolean;
  acceptedBrands?: CardBrandName[];
  defaultValues?: { name?: string };
  onFocus?: (event: FieldEvent) => void;
  onBlur?: (event: FieldEvent) => void;
  onKeyUp?: (event: FieldEvent) => void;
  onKeyDown?: (event: FieldEvent) => void;
  redactCVC?: boolean;
  allow3DigitAmexCVC?: boolean;
  validation?: CardOptions["validation"];
}

export function Card({
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
}: CardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const config = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  const instance = useEvInstance({
    onMount(evervault) {
      if (!ref.current) return;
      const inst = evervault.ui.card(config);
      inst.mount(ref.current);
      return inst;
    },
    onUpdate(instance) {
      instance.update(config);
    },
    onMountError: onError,
  });

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

  return <div ref={ref} />;
}
