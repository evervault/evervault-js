import * as React from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ColorScheme, ComponentError, ThemeDefinition } from "types";
import type EvervaultClient from "@evervault/browser";
import { useEvInstance } from "../useEvInstance";

export interface ThreeDSecureProps {
  session: string;
  colorScheme?: ColorScheme;
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
  colorScheme,
  theme,
  size,
  onReady,
  onError,
  onSuccess,
  onFailure,
  failOnChallenge,
}: ThreeDSecureProps) {
  const ref = useRef<HTMLDivElement>(null);

  const config = useMemo(
    () => ({
      colorScheme,
      theme,
      size,
      failOnChallenge,
    }),
    [colorScheme, theme, size, failOnChallenge]
  );

  const onMount = useCallback(
    (evervault: EvervaultClient) => {
      if (!ref.current) return;
      const inst = evervault.ui.threeDSecure(session, config);
      inst.mount(ref.current);
      return inst;
    },
    [session, config]
  );

  const onUpdate = useCallback(
    (instance: NonNullable<ReturnType<typeof onMount>>) => {
      instance.update(config);
    },
    [config]
  );

  const instance = useEvInstance({
    onMount,
    onUpdate,
    onMountError: onError,
  });

  useEffect(() => {
    if (!instance || !onReady) return undefined;
    return instance?.on("ready", onReady);
  }, [instance, onReady]);

  useEffect(() => {
    if (!instance || !onSuccess) return undefined;
    return instance?.on("success", onSuccess);
  }, [instance, onSuccess]);

  useEffect(() => {
    if (!instance || !onFailure) return undefined;
    return instance?.on("failure", onFailure);
  }, [instance, onFailure]);

  useEffect(() => {
    if (!instance || !onError) return undefined;
    return instance?.on("error", onError);
  }, [instance, onError]);

  return <div ref={ref} />;
}
