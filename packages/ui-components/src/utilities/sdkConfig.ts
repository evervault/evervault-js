export const SDK_CONFIG_META_NAME = "evervault:config";

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

function envString(env: BuildEnv, key: string): string | undefined {
  const value = env[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * The URLs baked into the bundle at build time. These are written into the
 * `evervault:config` meta tag and are also the fallback used when that tag is
 * missing or invalid.
 *
 * Build environment overrides go through the same validation and origin
 * normalisation as the meta tag, so a URL reaches the frame in one shape
 * whichever route it took. An override that fails validation is dropped in
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
 * Parses the `evervault:config` meta tag content. Any problem with the tag
 * discards it entirely in favour of `defaults`, so a partially rewritten tag
 * can never leave some requests pointed at a custom domain and others not.
 */
export function parseSdkConfig(
  content: string | null | undefined,
  defaults: SdkConfig
): SdkConfig {
  if (content == null) {
    console.error(
      `Missing <meta name="${SDK_CONFIG_META_NAME}">: falling back to default Evervault hosts`
    );
    return defaults;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    console.error(
      `Ignoring <meta name="${SDK_CONFIG_META_NAME}">: content is not valid JSON`
    );
    return defaults;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    console.error(
      `Ignoring <meta name="${SDK_CONFIG_META_NAME}">: content is not a JSON object`
    );
    return defaults;
  }

  const record = parsed as Record<string, unknown>;
  const results = SDK_CONFIG_KEYS.map(
    (key) => [key, validate(key, record[key])] as const
  );
  const errors = results.flatMap(([, result]) =>
    "error" in result ? [result.error] : []
  );

  if (errors.length > 0) {
    console.error(
      `Ignoring <meta name="${SDK_CONFIG_META_NAME}">: ${errors.join(", ")}`
    );
    return defaults;
  }

  const config = {} as SdkConfig;
  for (const [key, result] of results) {
    if ("url" in result) config[key] = result.url;
  }
  return config;
}
