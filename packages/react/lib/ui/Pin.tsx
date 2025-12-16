import * as React from "react";
import { useMemo, useRef } from "react";
import type { PinOptions, PinPayload } from "types";
import { useEvInstance } from "../useEvInstance";

export type PinProps = PinOptions & {
  onReady?: () => void;
  onError?: () => void;
  onChange?: (data: PinPayload) => void;
};

export function Pin({
  colorScheme,
  theme,
  autoFocus,
  mode,
  inputType,
  length,
  onReady,
  onChange,
  onError,
}: PinProps) {
  const ref = useRef<HTMLDivElement>(null);

  const config = useMemo(
    () => ({
      colorScheme,
      theme,
      length,
      autoFocus,
      mode,
      inputType,
    }),
    [colorScheme, theme, length, autoFocus, mode, inputType]
  );

  const instance = useEvInstance({
    onMount(evervault) {
      if (!ref.current) return;
      const inst = evervault.ui.pin(config);
      inst.mount(ref.current);
      return inst;
    },
    onUpdate(instance) {
      instance.update(config);
    },
    onMountError: onError,
  });

  // setup ready event listener
  React.useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  // setup error event listener
  React.useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  // setup change event listener
  React.useEffect(() => {
    if (!instance || !onChange) return undefined;
    return instance?.on("change", onChange);
  }, [instance, onChange]);

  return <div ref={ref} />;
}
