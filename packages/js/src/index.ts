import type EvervaultClient from "@evervault/browser";
import type { CustomConfig } from "@evervault/browser";

export type EvervaultInstance = EvervaultClient;
export type EvervaultConstructor = typeof EvervaultClient;

declare global {
  interface Window {
    Evervault: EvervaultConstructor | undefined;
  }
}

let injectionPromise: Promise<void> | null = null;

async function injectScript(): Promise<void> {
  if (injectionPromise) return injectionPromise;

  injectionPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = import.meta.env.VITE_EVERVAULT_JS_URL!;

    script.onload = () => resolve();

    script.onerror = () => {
      injectionPromise = null;
      reject();
    };

    if (!document.head) {
      throw new Error(
        "Expected document.head not to be null. Evervault.js requires a <head> element."
      );
    }

    document.head.appendChild(script);
  });

  return injectionPromise;
}

async function load(): Promise<EvervaultConstructor | null> {
  // return null if run on the server.
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  // If already loaded, return immediately.
  if (window.Evervault) {
    return window.Evervault;
  }

  try {
    await injectScript();
  } catch {
    throw new Error("Failed to load Evervault.js");
  }

  return window.Evervault || null;
}

export async function loadEvervault(
  team: string,
  app: string,
  config?: CustomConfig
): Promise<EvervaultInstance | null> {
  try {
    const Client = await load();
    if (!Client) return null;
    return new Client(team, app, config);
  } catch {
    return null;
  }
}

// Automatically inject the Evervault browser script
// We call this after 1 tick to allow users to handle the script
// injection themselves.
Promise.resolve().then(() => {
  load();
});
