import type Evervault from "@evervault/browser";
import { useCallback, useEffect, useRef } from "react";
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
      if (instance.current) {
        instance.current.unmount();
        instance.current = null;
      }

      async function init() {
        const evervault = await ev;
        if (!evervault) return;
        try {
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
        } catch (error) {
          instance.current = null;
          if (callbacks?.onError) {
            callbacks.onError(error as ComponentError);
          }
        }
      }

      void init();
    },
    [ev, opts]
  );

  useEffect(() => {
    return () => {
      if (instance.current) {
        instance.current.unmount();
        instance.current = null;
      }
    };
  }, []);

  const update = useCallback((newOptions?: UseThreeDSecureOptions) => {
    if (!instance.current) return;
    instance.current.update(newOptions);
  }, []);

  return {
    start,
    update,
  };
}
