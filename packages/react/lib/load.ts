import EvervaultClient, {
  CustomConfig as BrowserConfig,
} from "@evervault/browser";
import React, { useMemo } from "react";
import { useId } from "react";

export class PromisifiedEvervaultClient extends Promise<EvervaultClient> {
  public async encrypt(data: unknown) {
    const ev = await this;
    return ev.encrypt(data);
  }

  public async decrypt(token: string, data: unknown) {
    const ev = await this;
    return ev.decrypt(token, data);
  }
}

const EVERVAULT_URL = "https://js.evervault.com/v2";

type RequireFunction = (
  deps: string[],
  onLoad: (mod?: unknown) => void,
  onError?: (err: unknown) => void
) => void;

function injectScript(overrideUrl?: string) {
  return new Promise<typeof EvervaultClient>((resolve, reject) => {
    const url = overrideUrl && overrideUrl !== "" ? overrideUrl : EVERVAULT_URL;

    const w = window as unknown as {
      define?:
        | (((...args: unknown[]) => unknown) & { amd?: unknown })
        | undefined;
      require?: RequireFunction;
      requirejs?: RequireFunction;
    };

    // Handle cases when AMD is present. If window.require|window.requriejs is not present,
    // then fallback to loading the script directly.
    if (typeof w.define === "function" && w.define?.amd) {
      const amdRequire = w.require || w.requirejs;
      if (amdRequire) {
        amdRequire(
          [url],
          (client?: unknown) => {
            const ExportedEvervault = client as
              | typeof EvervaultClient
              | undefined;
            if (ExportedEvervault) {
              resolve(ExportedEvervault);
            } else {
              reject(
                new Error(
                  "Evervault.js AMD module did not export Evervault client"
                )
              );
            }
          },
          () => {
            reject(new Error("Failed to load Evervault.js via AMD"));
          }
        );
        return;
      }
    }

    const script = document.createElement("script");

    script.addEventListener("load", () => {
      if (window.Evervault) {
        resolve(window.Evervault);
      } else {
        reject(new Error("Evervault.js not available"));
      }
    });

    script.addEventListener("error", () => {
      reject(new Error("Failed to load Evervault.js"));
    });

    script.src = url;

    const headOrBody = document.head || document.body;

    if (!headOrBody) {
      throw new Error(
        "Expected document.body not to be null. Evervault.js requires a <body> element."
      );
    }

    headOrBody.appendChild(script);
  });
}

type EvervaultClientPromise = Promise<typeof EvervaultClient>;
const evervaultPromiseMap: Record<string, EvervaultClientPromise> = {};

interface LoadScriptOptions {
  overrideUrl?: string;
  onLoadError?: () => void;
}

function loadScript(
  loadKey: string,
  options?: LoadScriptOptions
): EvervaultClientPromise {
  // Ensure that we only attempt to load Evervault.js at most once
  if (!evervaultPromiseMap[loadKey]) {
    evervaultPromiseMap[loadKey] = new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Evervault.js not available"));
        return;
      }

      if (window.Evervault) {
        console.warn("Evervault has already been loaded");
        resolve(window.Evervault);
        return;
      }

      injectScript(options?.overrideUrl).then(resolve).catch(reject);
    });
  }

  return evervaultPromiseMap[loadKey];
}

function loadEvervault(
  loadKey: string,
  options?: LoadScriptOptions
): EvervaultClientPromise {
  const evPromise = loadScript(loadKey, options);

  let loadCalled = false;

  evPromise.catch((err) => {
    if (!loadCalled) {
      console.warn(err);
    }
  });

  loadCalled = true;

  return evPromise;
}

export interface CustomConfig extends BrowserConfig {
  jsSdkUrl: string;
}

export interface UseEvervaultClientOptions {
  teamId: string;
  appId: string;
  customConfig?: CustomConfig;
  onLoadError?: () => void;
}

export function useEvervaultClient({
  teamId,
  appId,
  customConfig,
  onLoadError,
}: UseEvervaultClientOptions) {
  const id = useId();
  const [retryAttempt, setRetryAttempt] = React.useState(0);

  const [loadPromise, setLoadPromise] =
    React.useState<EvervaultClientPromise | null>(null);

  React.useEffect(() => {
    const loadKey = `${id}-${retryAttempt}-${customConfig?.jsSdkUrl}`;
    setLoadPromise(
      loadEvervault(loadKey, {
        overrideUrl: customConfig?.jsSdkUrl,
        onLoadError,
      })
    );
  }, [id, retryAttempt, customConfig?.jsSdkUrl, onLoadError]);

  const client = React.useMemo<PromisifiedEvervaultClient>(() => {
    return new PromisifiedEvervaultClient((resolve, reject) => {
      if (!loadPromise) return;

      loadPromise
        .then((Evervault) => new Evervault(teamId, appId, customConfig))
        .then(resolve, reject);
    });
  }, [loadPromise, teamId, appId, customConfig]);

  const reload = React.useCallback(() => {
    setRetryAttempt((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ client, reload }), [client, reload]);
}
