import EvervaultClient, {
  CustomConfig as BrowserConfig,
} from "@evervault/browser";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { PromisifiedEvervaultClient } from "./client";
import { injectScript } from "./inject-script";

export interface CustomConfig extends BrowserConfig {
  jsSdkUrl?: string;
}

export interface UseEvervaultClientOptions {
  teamId: string;
  appId: string;
  customConfig?: CustomConfig;
  /**
   * Callback function to be called when the Evervault script fails to load.
   */
  onLoadError?: (error: unknown) => void;
}

export interface UseEvervaultClientResult {
  client: PromisifiedEvervaultClient;
  /**
   * Attempts to reload the Evervault script.
   */
  reload: () => void;
}

export function useEvervaultClient({
  teamId,
  appId,
  customConfig,
  onLoadError,
}: UseEvervaultClientOptions): UseEvervaultClientResult {
  const id = useId();
  const [retryAttempt, setRetryAttempt] = useState(0);

  const loadMapRef = useRef<Record<string, Promise<typeof EvervaultClient>>>(
    {}
  );

  const loadKey = `${id}-${retryAttempt}-${customConfig?.jsSdkUrl}`;
  const findOrInjectScript = useCallback(
    (key: string, overrideUrl?: string) => {
      if (key in loadMapRef.current) {
        return loadMapRef.current[key];
      }

      const promise = injectScript(overrideUrl);
      loadMapRef.current[key] = promise;
      return promise;
    },
    []
  );

  const client = useMemo<PromisifiedEvervaultClient>(() => {
    return new PromisifiedEvervaultClient((resolve, reject) => {
      const promise = findOrInjectScript(loadKey, customConfig?.jsSdkUrl);

      promise
        .then((Evervault) => {
          resolve(new Evervault(teamId, appId, customConfig));
        })
        .catch((error) => {
          onLoadError?.(error);
          reject(error);
        });
    });
  }, [findOrInjectScript, loadKey, teamId, appId, customConfig, onLoadError]);

  const reload = useCallback(() => {
    setRetryAttempt((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ client, reload }), [client, reload]);
}
