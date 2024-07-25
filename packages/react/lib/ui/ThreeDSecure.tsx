import type Evervault from "@evervault/browser";
import * as React from "react";
import { useEvervault } from "../useEvervault";
import type { ComponentError, ThemeDefinition } from "types";

export interface ThreeDSecureProps {
  session: string;
  modal?: boolean;
  theme?: ThemeDefinition;
  size?: { width: string; height: string };
  onReady?: () => void;
  onComplete?: () => void;
  onError?: (error: ComponentError) => void;
}

type ThreeDSecureInstance = ReturnType<Evervault["ui"]["threeDSecure"]>;

export function ThreeDSecure({
  session,
  modal,
  theme,
  size,
  onReady,
  onError,
  onComplete,
}: ThreeDSecureProps) {
  const ev = useEvervault();
  const initialized = React.useRef(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [instance, setInstance] = React.useState<ThreeDSecureInstance | null>(
    null
  );

  React.useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  React.useEffect(() => {
    if (!instance || !onComplete) return undefined;
    return instance?.on("complete", onComplete);
  }, [instance, onComplete]);

  React.useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  const config = React.useMemo(
    () => ({
      theme,
      size,
    }),
    [theme, size]
  );

  React.useLayoutEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const inst = evervault.ui.threeDSecure(session, config);

      if (modal) {
        inst.mount();
      } else {
        inst.mount(ref.current as HTMLElement);
      }

      setInstance(inst);
    }

    if (instance) {
      instance.update(config);
    } else {
      init().catch(console.error);
    }
  }, [modal, instance, session, config]);

  return modal ? null : <div ref={ref} />;
}
