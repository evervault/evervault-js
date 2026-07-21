import EvervaultClient from "@evervault/browser";
import { loadScript } from "./load-script";
import { ScriptLoadError } from "./error";

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

export function injectScript(url: string, options?: InjectScriptOptions) {
  return new Promise<typeof EvervaultClient>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(
        new ScriptLoadError(
          "window_not_available",
          "Evervault.js is only available in browser environments with a global `window` object."
        )
      );
      return;
    }

    if (window.Evervault) {
      resolve(window.Evervault);
      return;
    }

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
                new ScriptLoadError(
                  "amd_module_not_exported",
                  "Evervault.js AMD module did not export Evervault client."
                )
              );
            }
          },
          (error) => {
            reject(
              new ScriptLoadError(
                "amd_module_error",
                "Failed to load Evervault.js via AMD require. See the cause for more details.",
                { cause: error }
              )
            );
          }
        );
        return;
      }
    }

    loadScript(url, options)
      .then(() => {
        if (window.Evervault) {
          resolve(window.Evervault);
        } else {
          reject(
            new ScriptLoadError(
              "evervault_not_available",
              "Evervault.js script did not load Evervault client."
            )
          );
        }
      })
      .catch((error) => reject(error));
  });
}
