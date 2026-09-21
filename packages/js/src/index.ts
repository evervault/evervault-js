import type EvervaultClient from "@evervault/browser";
import type { CustomConfig as BrowserConfig } from "@evervault/browser";
import { injectScript } from "sdk-loader";

export type EvervaultInstance = EvervaultClient;
export type EvervaultConstructor = typeof EvervaultClient;

export interface CustomConfig extends BrowserConfig {
  /**
   * URL to load the Evervault browser SDK from. Defaults to the Evervault
   * hosted bundle. Set this when serving Evervault assets from a custom domain.
   */
  jsSdkUrl?: string;
}

declare global {
  interface Window {
    Evervault: EvervaultConstructor | undefined;
  }
}

const DEFAULT_JS_SDK_URL = import.meta.env.VITE_EVERVAULT_JS_URL!;

let loadRequested = false;

async function load(jsSdkUrl?: string): Promise<EvervaultConstructor> {
  loadRequested = true;

  try {
    return await injectScript<EvervaultConstructor>(
      jsSdkUrl ?? DEFAULT_JS_SDK_URL,
      { reuseExistingClient: !jsSdkUrl }
    );
  } catch (cause) {
    throw new Error("Failed to load Evervault.js", { cause });
  }
}

export async function loadEvervault(
  team: string,
  app: string,
  config?: CustomConfig
): Promise<EvervaultInstance> {
  const Client = await load(config?.jsSdkUrl);
  return new Client(team, app, config);
}

// Automatically inject the Evervault browser script
// We call this after 1 tick to allow users to handle the script
// injection themselves.
Promise.resolve().then(() => {
  if (!loadRequested) load().catch(() => undefined);
});
