import type Evervault from "@evervault/browser";
import * as React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useEvervault } from "../useEvervault";
import type {
  CardDetailsPayload,
  CardDetailsTranslations,
  SwipedCardDetails,
  ThemeDefinition,
} from "types";

export interface CardDetailsProps {
  theme?: ThemeDefinition;
  translations?: CardDetailsTranslations;
  onReady?: () => void;
  onError?: () => void;
  onSwipe?: (data: SwipedCardDetails) => void;
  onChange?: (data: CardDetailsPayload) => void;
}

type CardDetailsClass = ReturnType<Evervault["ui"]["cardDetails"]>;

export function CardDetails({
  theme,
  onSwipe,
  onReady,
  onError,
  onChange,
  translations,
}: CardDetailsProps) {
  const ev = useEvervault();
  const initialized = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = React.useState<CardDetailsClass | null>(null);

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

  const config = useMemo(
    () => ({
      theme,
      translations,
    }),
    [theme, translations]
  );

  useLayoutEffect(() => {
    if (!ref.current) return;

    async function init() {
      if (initialized.current || !ref.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const inst = evervault.ui.cardDetails(config);
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
