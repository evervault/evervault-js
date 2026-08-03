import type Evervault from "@evervault/browser";
import { useCallback, useEffect, useRef } from "react";
import { ColorScheme, ComponentError, ThemeDefinition } from "types";
import { useEvervault } from "../useEvervault";

interface UseThreeDSecureOptions {
  colorScheme?: ColorScheme;
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
  const lock = useRef(false);

  const start = useCallback(
    (session: string, callbacks?: UseThreeDSecureCallbacks) => {
      if (instance.current || lock.current) {
        console.warn("Evervault frame already mounted");
        return;
      }

      lock.current = true;

      async function init() {
        const evervault = await ev;

        if (!evervault) {
          lock.current = false;
          return;
        }

        try {
          instance.current = evervault.ui.threeDSecure(session, opts);

          if (callbacks?.onReady) {
            instance.current.on("ready", callbacks.onReady);
          }

          if (callbacks?.onSuccess) {
            instance.current.on("success", () => {
              lock.current = false;
              instance.current = null;
              callbacks.onSuccess?.();
            });
          }

          if (callbacks?.onFailure) {
            instance.current.on("failure", () => {
              lock.current = false;
              instance.current = null;
              callbacks.onFailure?.();
            });
          }

          if (callbacks?.onError) {
            instance.current.on("error", (error) => {
              lock.current = false;
              instance.current = null;
              callbacks.onError?.(error);
            });
          }

          instance.current.mount();
        } catch (error) {
          instance.current = null;
          lock.current = false;
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
      }
      instance.current = null;
      lock.current = false;
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
