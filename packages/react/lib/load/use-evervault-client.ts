import { CustomConfig as BrowserConfig } from "@evervault/browser";
import { useCallback, useMemo, useRef, useState } from "react";
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

  // Read via ref so an inline onLoadError (new identity every render) doesn't
  // count as a deps change below and bust the cache.
  const onLoadErrorRef = useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;

  // Cache by deps identity so a repeat invocation reuses 
  // the client instead of constructing a second one.
  const cacheRef = useRef<{
    deps: unknown[];
    client: PromisifiedEvervaultClient;
  } | null>(null);

  const client = useMemo<PromisifiedEvervaultClient>(() => {
    const deps = [reloadAttempt, teamId, appId, customConfig, timeout];
    const cached = cacheRef.current;
    if (cached && depsEqual(cached.deps, deps)) {
      return cached.client;
    }

    const created = new PromisifiedEvervaultClient(async (resolve, reject) => {
      try {
        const url = new URL(customConfig?.jsSdkUrl || EVERVAULT_URL);
        if (reloadAttempt > 0) {
          url.searchParams.set("attempt", String(reloadAttempt + 1));
        }
        const Evervault = await injectScript(url.toString(), { timeout });
        const client = await Evervault.init(teamId, appId, customConfig);
        resolve(client);
      } catch (error) {
        onLoadErrorRef.current?.(error);
        reject(error);
      }
    });

    cacheRef.current = { deps, client: created };
    return created;
  }, [reloadAttempt, teamId, appId, customConfig, timeout]);

  return useMemo(() => ({ client, reload }), [client, reload]);
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
}
