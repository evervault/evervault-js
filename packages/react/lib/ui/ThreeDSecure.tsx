import type Evervault from "@evervault/browser";
import * as React from "react";
import { useEvervault } from "../useEvervault";
import type { ComponentError, ThemeDefinition } from "types";

export interface ThreeDSecureProps {
  session: string;
  theme?: ThemeDefinition;
  size?: { width: string; height: string };
  onReady?: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
  onError?: (error: ComponentError) => void;
  failOnChallenge?: boolean | (() => void);
}

type ThreeDSecureInstance = ReturnType<Evervault["ui"]["threeDSecure"]>;

export function ThreeDSecure({
  session,
  theme,
  size,
  onReady,
  onError,
  onSuccess,
  onFailure,
  failOnChallenge,
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
    if (!instance || !onSuccess) return undefined;
    return instance?.on("success", onSuccess);
  }, [instance, onSuccess]);

  React.useEffect(() => {
    if (!instance || !onFailure) return undefined;
    return instance?.on("failure", onFailure);
  }, [instance, onFailure]);

  React.useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  const config = React.useMemo(
    () => ({
      theme,
      size,
      failOnChallenge,
    }),
    [theme, size, failOnChallenge]
  );

  React.useLayoutEffect(() => {
    async function init() {
      if (initialized.current) return;
      initialized.current = true;
      const evervault = await ev;
      if (!evervault) return;
      const inst = evervault.ui.threeDSecure(session, config);
      inst.mount(ref.current as HTMLElement);
      setInstance(inst);
    }

    if (instance) {
      instance.update(config);
    } else {
      init().catch(console.error);
    }
  }, [instance, session, config]);

  return <div ref={ref} />;
}
