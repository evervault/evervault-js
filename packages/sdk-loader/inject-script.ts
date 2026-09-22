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
   *
   * @default 15000
   */
  timeout?: number;
  /**
   * Whether a client already on `window` may be reused instead of loading
   * `url`. Reuse wins over a bundle this loader fetched for `url`, so a page
   * that loads Evervault.js itself is never overridden by a speculative load.
   *
   * Pass `false` whenever the caller asked for a specific URL. Nothing records
   * which bundle defined the global, so reusing it would silently ignore that
   * URL, and whether it exists yet depends on network timing — which would
   * make the resolved client nondeterministic.
   *
   * @default true
   */
  reuseExistingClient?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15_000;

const loads = new Map<string, Promise<unknown>>();

/** Discards every in-flight and completed load. For tests only. */
export function resetScriptLoads(): void {
  loads.clear();
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
 * defines. A script already in the document for that URL is waited on rather
 * than loaded again, concurrent and repeat calls for the same URL share one
 * load, and a failed load is discarded so the next call retries.
 *
 * The timeout of the call that starts a load governs every caller waiting on
 * it.
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

  if (options?.reuseExistingClient !== false) {
    const existing = globalClient<TClient>();
    if (existing) return Promise.resolve(existing);
  }

  const cached = loads.get(url);
  if (cached) return cached as Promise<TClient>;

  const load = resolveClient<TClient>(url, {
    ...options,
    timeout: options?.timeout ?? DEFAULT_TIMEOUT_MS,
  });
  loads.set(url, load);
  load.catch(() => loads.delete(url));

  return load;
}

async function resolveClient<TClient>(
  url: string,
  options?: InjectScriptOptions
): Promise<TClient> {
  const require = amdRequire();
  if (require) return requireModule<TClient>(require, url);

  await loadScript(url, {
    ...options,
    isLoaded: () => globalClient<TClient>() !== undefined,
  });

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
