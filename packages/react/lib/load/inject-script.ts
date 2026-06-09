import EvervaultClient from "@evervault/browser";

const EVERVAULT_URL = "https://js.evervault.com/v2";

type RequireFunction = (
  deps: string[],
  onLoad: (mod?: unknown) => void,
  onError?: (err: unknown) => void
) => void;

export function injectScript(overrideUrl?: string) {
  return new Promise<typeof EvervaultClient>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Evervault.js not available"));
      return;
    }

    if (window.Evervault) {
      resolve(window.Evervault);
      return;
    }

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
