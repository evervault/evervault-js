import type Evervault from "@evervault/browser";
import { useCallback, useRef } from "react";
import { ComponentError, ThemeDefinition } from "types";
import { useEvervault } from "../useEvervault";

interface UseThreeDSecureOptions {
  theme?: ThemeDefinition;
  size?: { width: string; height: string };
  failOnChallenge?: boolean | (() => boolean) | (() => Promise<boolean>);
}

interface UseThreeDSecureCallbacks {
  onReady?: () => void;
  onSuccess?: () => void;
  onFailure?: () => void;
  onError?: (error: ComponentError) => void;
}

type ThreeDSecureInstance = ReturnType<Evervault["ui"]["threeDSecure"]>;

export function useThreeDSecure(opts?: UseThreeDSecureOptions) {
  const ev = useEvervault();
  const instance = useRef<ThreeDSecureInstance | null>(null);

  const start = useCallback(
    (session: string, callbacks?: UseThreeDSecureCallbacks) => {
      if (instance.current) return;

      async function init() {
        const evervault = await ev;
        if (!evervault) return;
        instance.current = evervault.ui.threeDSecure(session, opts);

        if (callbacks?.onReady) {
          instance.current.on("ready", callbacks.onReady);
        }

        if (callbacks?.onSuccess) {
          instance.current.on("success", callbacks.onSuccess);
        }

        if (callbacks?.onFailure) {
          instance.current.on("failure", callbacks.onFailure);
        }

        if (callbacks?.onError) {
          instance.current.on("error", callbacks.onError);
        }

        instance.current.mount();
      }

      void init();
    },
    [ev, opts]
  );

  const update = useCallback((newOptions?: UseThreeDSecureOptions) => {
    if (!instance.current) return;
    instance.current.update(newOptions);
  }, []);

  return {
    start,
    update,
  };
}
