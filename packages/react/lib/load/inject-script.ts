import EvervaultClient from "@evervault/browser";
import { loadScript } from "./load-script";

type RequireFunction = (
  deps: string[],
  onLoad: (mod?: unknown) => void,
  onError?: (err: unknown) => void
) => void;

export function injectScript(url: string) {
  return new Promise<typeof EvervaultClient>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Evervault.js not available"));
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

    loadScript(url)
      .then(() => {
        if (window.Evervault) {
          resolve(window.Evervault);
        } else {
          reject(new Error("Evervault.js not available"));
        }
      })
      .catch((error) => {
        reject(error ?? new Error("Failed to load Evervault.js"));
      });
  });
}
