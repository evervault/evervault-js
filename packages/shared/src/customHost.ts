export interface CustomHostUrls {
  jsSdkUrl: string;
  keysUrl: string;
  apiUrl: string;
  componentsUrl: string;
}

/**
 * The https origin for `host`, a hostname with an optional port such as
 * `payments.acme.com`. Returns null for anything else, including a value with
 * a scheme, path or credentials.
 */
export function customHostOrigin(host: unknown): string | null {
  if (typeof host !== "string" || host === "") return null;
  if (/[/?#@\\\s]/.test(host)) return null;

  try {
    return new URL(`https://${host}`).origin;
  } catch {
    return null;
  }
}

/**
 * The Evervault URLs served from a custom host's `origin`, which routes each
 * service by path.
 */
export function customHostUrls(origin: string): CustomHostUrls {
  return {
    jsSdkUrl: `${origin}/js/v2`,
    keysUrl: `${origin}/keys/`,
    apiUrl: `${origin}/api`,
    componentsUrl: `${origin}/`,
  };
}
