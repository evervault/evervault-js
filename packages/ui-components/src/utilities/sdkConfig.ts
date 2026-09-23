export interface SdkConfig {
  jsSdkUrl: string;
  keysUrl: string;
  apiUrl: string;
}

export type BuildEnv = Record<string, unknown>;

const SDK_CONFIG_KEYS = ["jsSdkUrl", "keysUrl", "apiUrl"] as const;

const DEFAULT_SDK_CONFIG: SdkConfig = {
  jsSdkUrl: "https://js.evervault.com/v2",
  keysUrl: "https://keys.evervault.com",
  apiUrl: "https://api.evervault.com",
};

const SDK_CONFIG_ENV_KEYS: Record<keyof SdkConfig, string> = {
  jsSdkUrl: "VITE_EVERVAULT_JS_URL",
  keysUrl: "VITE_KEYS_URL",
  apiUrl: "VITE_API_URL",
};

const ORIGIN_ONLY_KEYS: readonly (keyof SdkConfig)[] = ["keysUrl", "apiUrl"];

const LOOPBACK_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

const EVERVAULT_ORIGINS = [
  "https://ui-components.evervault.com",
  "https://ui-components.evervault.io",
];

function envString(env: BuildEnv, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * The URLs baked into the bundle at build time, used when the frame is served
 * from an Evervault origin.
 *
 * Build environment overrides go through the same validation and origin
 * normalisation, so a URL reaches the frame in one shape. An override that fails validation is dropped in
 * favour of the Evervault production host.
 */
export function buildTimeSdkConfig(env: BuildEnv): SdkConfig {
  const config = { ...DEFAULT_SDK_CONFIG };

  for (const key of SDK_CONFIG_KEYS) {
    const envKey = SDK_CONFIG_ENV_KEYS[key];
    const value = envString(env, envKey);
    if (value === undefined) continue;

    const result = validate(key, value);
    if ("error" in result) {
      console.error(`Ignoring ${envKey}: ${result.error}`);
      continue;
    }

    config[key] = result.url;
  }

  return config;
}

type Validated = { url: string } | { error: string };

function validate(key: keyof SdkConfig, value: unknown): Validated {
  if (typeof value !== "string" || value === "") {
    return { error: `${key} must be a non-empty string` };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { error: `${key} is not a valid URL` };
  }

  const isLoopback = LOOPBACK_HOSTNAMES.includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback)) {
    return { error: `${key} must use https` };
  }

  if (url.username !== "" || url.password !== "") {
    return { error: `${key} must not contain credentials` };
  }

  if (url.search !== "" || url.hash !== "") {
    return { error: `${key} must not contain a query string or fragment` };
  }

  if (!ORIGIN_ONLY_KEYS.includes(key)) {
    return { url: value };
  }

  if (url.pathname !== "/" && url.pathname !== "") {
    return { error: `${key} must not contain a path` };
  }

  return { url: url.origin };
}

/**
 * Picks the URLs for the frame served from `origin`. On an Evervault origin or
 * loopback this is `defaults`. Any other origin is a custom domain that routes
 * by path, so every URL is built on that same origin.
 */
export function resolveSdkConfig(
  origin: string,
  defaults: SdkConfig
): SdkConfig {
  if (EVERVAULT_ORIGINS.includes(origin)) return defaults;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return defaults;
  }
  if (LOOPBACK_HOSTNAMES.includes(url.hostname)) return defaults;

  return {
    jsSdkUrl: `${url.origin}/js/v2`,
    keysUrl: `${url.origin}/keys/`,
    apiUrl: `${url.origin}/api`,
  };
}
