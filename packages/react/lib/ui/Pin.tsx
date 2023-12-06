import type Evervault from "@evervault/browser";
import * as React from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useEvervault } from "../useEvervault";
import type { PinOptions, PinPayload } from "types";

export type PinProps = PinOptions & {
  onReady?: () => void;
  onError?: () => void;
  onChange?: (data: PinPayload) => void;
};

type PinClass = ReturnType<Evervault["ui"]["pin"]>;

export function Pin({ theme, onReady, onChange, onError, length }: PinProps) {
  const ev = useEvervault();
  const initialized = useRef(false);
  const [instance, setInstance] = React.useState<PinClass | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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

  const config = useMemo(
    () => ({
      theme,
      length,
    }),
    [theme, length]
  );

  useLayoutEffect(() => {
    if (!ref.current) return;
    async function init() {
      if (initialized.current || !ref.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const inst = evervault.ui.pin(config);
      inst.mount(ref.current);
      setInstance(inst);
    }

    if (instance) {
      instance.update(config);
    } else {
      init().catch(console.error);
    }
  }, [instance, config]);

  return <div ref={ref} />;
}
