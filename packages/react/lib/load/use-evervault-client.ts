import { CustomConfig as BrowserConfig } from "@evervault/browser";
import { useCallback, useMemo, useState } from "react";
import { PromisifiedEvervaultClient } from "./client";
import { injectScript } from "./inject-script";

const EVERVAULT_URL = "https://js.evervault.com/v2";

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
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const reload = useCallback(() => {
    setReloadAttempt((prev) => prev + 1);
  }, []);

  const client = useMemo<PromisifiedEvervaultClient>(() => {
    return new PromisifiedEvervaultClient((resolve, reject) => {
      const baseUrl = customConfig?.jsSdkUrl || EVERVAULT_URL;
      const search = new URLSearchParams();
      if (reloadAttempt > 0) {
        search.set("attempt", String(reloadAttempt + 1));
      }

      let url = baseUrl;
      if (search.size > 0) {
        url = `${baseUrl}?${search.toString()}`;
      }

      const promise = injectScript(url);

      promise
        .then((Evervault) => {
          resolve(new Evervault(teamId, appId, customConfig));
        })
        .catch((error) => {
          onLoadError?.(error);
          reject(error);
        });
    });
  }, [reloadAttempt, teamId, appId, customConfig, onLoadError]);

  return useMemo(() => ({ client, reload }), [client, reload]);
}
