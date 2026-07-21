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
   * Callback function to be called when the Evervault.js script fails to load.
   */
  onLoadError?: (error: unknown) => void;
  /**
   * The timeout in milliseconds to wait for the Evervault script to load.
   * @default 15000
   */
  timeout?: number;
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
  timeout = 15000,
}: UseEvervaultClientOptions): UseEvervaultClientResult {
  const [reloadAttempt, setReloadAttempt] = useState(0);
  const reload = useCallback(() => {
    setReloadAttempt((prev) => prev + 1);
  }, []);

  const client = useMemo<PromisifiedEvervaultClient>(() => {
    return new PromisifiedEvervaultClient(async (resolve, reject) => {
      try {
        const url = new URL(customConfig?.jsSdkUrl || EVERVAULT_URL);
        if (reloadAttempt > 0) {
          url.searchParams.set("attempt", String(reloadAttempt + 1));
        }
        const Evervault = await injectScript(url.toString(), { timeout });
        const client = await Evervault.init(teamId, appId, customConfig);
        resolve(client);
      } catch (error) {
        onLoadError?.(error);
        reject(error);
      }
    });
  }, [reloadAttempt, teamId, appId, customConfig, onLoadError, timeout]);

  return useMemo(() => ({ client, reload }), [client, reload]);
}
