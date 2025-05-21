import * as React from "react";
import type { ComponentError, ThemeDefinition } from "types";
import { useEvInstance } from "../useEvInstance";

export interface ThreeDSecureProps {
  session: string;
  theme?: ThemeDefinition;
  size?: { width: string; height: string };
  onReady?: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
  onError?: (error: ComponentError) => void;
  failOnChallenge?: boolean | (() => boolean) | (() => Promise<boolean>);
}

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
  const ref = React.useRef<HTMLDivElement>(null);

  const config = React.useMemo(
    () => ({
      theme,
      size,
      failOnChallenge,
    }),
    [theme, size, failOnChallenge]
  );

  const instance = useEvInstance({
    onMount(evervault) {
      if (!ref.current) return;
      const inst = evervault.ui.threeDSecure(session, config);
      inst.mount(ref.current as HTMLElement);
      return inst;
    },
    onUpdate(instance) {
      instance.update(config);
    },
  });

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

  return <div ref={ref} />;
}
