import type Evervault from "@evervault/browser";
import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useEvervault } from "../useEvervault";
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
}

type CardClass = ReturnType<Evervault["ui"]["card"]>;

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
}: CardProps) {
  const ev = useEvervault();
  const initialized = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = React.useState<CardClass | null>(null);

  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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
    ]
  );

  useLayoutEffect(() => {
    if (!ref.current) return;

    async function init() {
      try {
        if (initialized.current || !ref.current) return;
        initialized.current = true;
        const evervault = await ev;
        if (!evervault) return;
        const inst = evervault.ui.card(config);
        inst.mount(ref.current);
        setInstance(inst);
      } catch (err) {
        onErrorRef.current?.();
        console.error(err);
      }
    }

    if (instance) {
      instance.update(config);
    } else {
      init();
    }
  }, [ev, config, instance]);

  return <div ref={ref} />;
}
