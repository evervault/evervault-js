import { ScriptLoadError } from "./error";
import { loadScript } from "./load-script";

type RequireFunction = (
  deps: string[],
  onLoad: (mod?: unknown) => void,
  onError?: (err: unknown) => void
) => void;

export interface InjectScriptOptions {
  /**
   * The timeout in milliseconds for the script load.
   * If the script load takes longer than the timeout, the promise will be rejected.
   * Not compatible with AMD require.
   */
  timeout?: number;
}

function globalClient<TClient>(): TClient | undefined {
  return (window as unknown as { Evervault?: TClient }).Evervault;
}

function amdRequire(): RequireFunction | undefined {
  const w = window as unknown as {
    define?:
      | (((...args: unknown[]) => unknown) & { amd?: unknown })
      | undefined;
    require?: RequireFunction;
    requirejs?: RequireFunction;
  };

  if (typeof w.define !== "function" || !w.define.amd) return undefined;
  return w.require || w.requirejs;
}

/**
 * Loads the Evervault browser SDK from `url` and resolves the client it
 * defines. A client already on `window` is used in preference to loading
 * `url`.
 */
export function injectScript<TClient = unknown>(
  url: string,
  options?: InjectScriptOptions
): Promise<TClient> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new ScriptLoadError(
        "window_not_available",
        "Evervault.js is only available in browser environments with a global `window` object."
      )
    );
  }

  const existing = globalClient<TClient>();
  if (existing) return Promise.resolve(existing);

  return resolveClient<TClient>(url, options);
}

async function resolveClient<TClient>(
  url: string,
  options?: InjectScriptOptions
): Promise<TClient> {
  const require = amdRequire();
  if (require) return requireModule<TClient>(require, url);

  await loadScript(url, options);

  const client = globalClient<TClient>();
  if (!client) {
    throw new ScriptLoadError(
      "evervault_not_available",
      "Evervault.js script did not load Evervault client."
    );
  }

  return client;
}

function requireModule<TClient>(
  require: RequireFunction,
  url: string
): Promise<TClient> {
  return new Promise<TClient>((resolve, reject) => {
    require([url], (module?: unknown) => {
      const client = module as TClient | undefined;
      if (client) {
        resolve(client);
      } else {
        reject(
          new ScriptLoadError(
            "amd_module_not_exported",
            "Evervault.js AMD module did not export Evervault client."
          )
        );
      }
    }, (error) => {
      reject(
        new ScriptLoadError(
          "amd_module_error",
          "Failed to load Evervault.js via AMD require. See the cause for more details.",
          { cause: error }
        )
      );
    });
  });
}
