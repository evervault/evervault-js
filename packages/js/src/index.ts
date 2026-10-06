import type EvervaultClient from "@evervault/browser";
import type { CustomConfig } from "@evervault/browser";
import { injectScript } from "sdk-loader";
import { customHostOrigin, customHostUrls } from "shared/customHost";

export { minimal, clean, material, cssVar } from "themes";
export type { PresetConfig } from "themes";
export type { ThemeDefinition } from "types";

export type { CustomConfig };
export type EvervaultInstance = EvervaultClient;
export type EvervaultConstructor = typeof EvervaultClient;

declare global {
  interface Window {
    Evervault: EvervaultConstructor | undefined;
  }
}

const DEFAULT_JS_SDK_URL = import.meta.env.VITE_EVERVAULT_JS_URL!;

function sdkUrl(host: string | undefined): string {
  if (host === undefined) return DEFAULT_JS_SDK_URL;

  const origin = customHostOrigin(host);
  if (!origin) {
    throw new Error(
      "customDomain must be a hostname, such as payments.acme.com"
    );
  }

  return customHostUrls(origin).jsSdkUrl;
}

async function load(host?: string): Promise<EvervaultConstructor> {
  const url = sdkUrl(host);

  try {
    return await injectScript<EvervaultConstructor>(url, {
      reuseExistingClient: host === undefined,
    });
  } catch (cause) {
    throw new Error("Failed to load Evervault.js", { cause });
  }
}

export async function loadEvervault(
  team: string,
  app: string,
  config?: CustomConfig
): Promise<EvervaultInstance> {
  const Client = await load(config?.customDomain);
  return new Client(team, app, config);
}
