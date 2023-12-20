import type Evervault from "@evervault/browser";
import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useEvervault } from "../useEvervault";
import type {
  CardField,
  CardPayload,
  CardTranslations,
  SwipedCard,
  ThemeDefinition,
} from "types";

export interface CardProps {
  theme?: ThemeDefinition;
  translations?: CardTranslations;
  fields?: CardField[];
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCard) => void;
  onChange?: (data: CardPayload) => void;
  onComplete?: (data: CardPayload) => void;
}

type CardClass = ReturnType<Evervault["ui"]["card"]>;

export function Card({
  theme,
  fields,
  onSwipe,
  onReady,
  onError,
  onChange,
  onComplete,
  translations,
}: CardProps) {
  const ev = useEvervault();
  const initialized = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = React.useState<CardClass | null>(null);

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

  const config = useMemo(
    () => ({
      theme,
      fields,
      translations,
    }),
    [theme, translations, fields]
  );

  useLayoutEffect(() => {
    if (!ref.current) return;

    async function init() {
      if (initialized.current || !ref.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const inst = evervault.ui.card(config);
      inst.mount(ref.current);
      setInstance(inst);
    }

    if (instance) {
      instance.update(config);
    } else {
      init().catch(console.error);
    }
  }, [config, instance]);

  return <div ref={ref} />;
}
