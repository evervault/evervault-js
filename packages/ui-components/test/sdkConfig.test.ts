/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTimeSdkConfig,
  parseSdkConfig,
  SDK_CONFIG_META_NAME,
  type SdkConfig,
} from "../src/utilities/sdkConfig";

const defaults: SdkConfig = {
  jsSdkUrl: "https://js.evervault.com/v2",
  keysUrl: "https://keys.evervault.com",
  apiUrl: "https://api.evervault.com",
};

const custom: SdkConfig = {
  jsSdkUrl: "https://payments.acme.com/v2",
  keysUrl: "https://keys.acme.com",
  apiUrl: "https://api.acme.com",
};

function setMeta(content: string) {
  const meta = document.createElement("meta");
  meta.setAttribute("name", SDK_CONFIG_META_NAME);
  meta.setAttribute("content", content);
  document.head.appendChild(meta);
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  document.head.innerHTML = "";
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("buildTimeSdkConfig", () => {
  it("falls back to the Evervault production hosts", () => {
    expect(buildTimeSdkConfig({})).toEqual(defaults);
  });

  it("prefers the build environment over the production hosts", () => {
    expect(
      buildTimeSdkConfig({
        VITE_EVERVAULT_JS_URL: "https://js.evervault.io/v2",
        VITE_KEYS_URL: "https://keys.evervault.io",
        VITE_API_URL: "https://api.evervault.io",
      })
    ).toEqual({
      jsSdkUrl: "https://js.evervault.io/v2",
      keysUrl: "https://keys.evervault.io",
      apiUrl: "https://api.evervault.io",
    });
  });

  it("ignores empty environment values", () => {
    expect(buildTimeSdkConfig({ VITE_API_URL: "" })).toEqual(defaults);
  });

  it("normalises origin-only environment values to their origin", () => {
    expect(
      buildTimeSdkConfig({ VITE_KEYS_URL: "https://keys.evervault.io/" })
    ).toEqual({ ...defaults, keysUrl: "https://keys.evervault.io" });
  });

  it("drops an environment value that fails validation", () => {
    expect(
      buildTimeSdkConfig({
        VITE_API_URL: "https://api.acme.com/v1",
        VITE_KEYS_URL: "nope",
      })
    ).toEqual(defaults);
    expect(console.error).toHaveBeenCalledTimes(2);
  });
});

describe("parseSdkConfig", () => {
  it("uses a valid tag", () => {
    expect(parseSdkConfig(JSON.stringify(custom), defaults)).toEqual(custom);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("normalises the origin-only URLs to their origin", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({ ...custom, apiUrl: "https://api.acme.com/" }),
        defaults
      )
    ).toEqual(custom);
  });

  it("falls back when the tag is missing", () => {
    expect(parseSdkConfig(null, defaults)).toEqual(defaults);
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back on malformed JSON", () => {
    expect(parseSdkConfig("{ not json", defaults)).toEqual(defaults);
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back when the content is not an object", () => {
    expect(parseSdkConfig('"https://api.acme.com"', defaults)).toEqual(
      defaults
    );
    expect(parseSdkConfig("[]", defaults)).toEqual(defaults);
  });

  it("falls back on a http: value", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({ ...custom, apiUrl: "http://api.acme.com" }),
        defaults
      )
    ).toEqual(defaults);
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back on an origin-only value carrying a path", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({
          ...custom,
          keysUrl: "https://keys.acme.com/evervault",
        }),
        defaults
      )
    ).toEqual(defaults);
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back on a value carrying a query string or fragment", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({ ...custom, apiUrl: "https://api.acme.com?a=1" }),
        defaults
      )
    ).toEqual(defaults);
    expect(
      parseSdkConfig(
        JSON.stringify({
          ...custom,
          jsSdkUrl: "https://payments.acme.com/v2#x",
        }),
        defaults
      )
    ).toEqual(defaults);
  });

  it("falls back on a value carrying credentials", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({ ...custom, apiUrl: "https://user:pass@api.acme.com" }),
        defaults
      )
    ).toEqual(defaults);
    expect(console.error).toHaveBeenCalled();
  });

  it("falls back when a key is missing or not a URL", () => {
    expect(
      parseSdkConfig(JSON.stringify({ apiUrl: custom.apiUrl }), defaults)
    ).toEqual(defaults);
    expect(
      parseSdkConfig(JSON.stringify({ ...custom, keysUrl: "nope" }), defaults)
    ).toEqual(defaults);
  });

  it("allows http on loopback so local development works", () => {
    const local = {
      jsSdkUrl: "http://localhost:4002/evervault-browser.main.umd.cjs",
      keysUrl: "http://localhost:4000",
      apiUrl: "http://127.0.0.1:4000",
    };
    expect(parseSdkConfig(JSON.stringify(local), defaults)).toEqual(local);
    expect(console.error).not.toHaveBeenCalled();
  });

  it("rejects the whole tag when only one value is invalid", () => {
    expect(
      parseSdkConfig(
        JSON.stringify({ ...custom, keysUrl: "http://keys.acme.com" }),
        defaults
      )
    ).toEqual(defaults);
  });
});

describe("config", () => {
  it("reads the meta tag from the document", async () => {
    setMeta(JSON.stringify(custom));
    const { sdkConfig, apiConfig } = await import("../src/utilities/config");
    expect(sdkConfig).toEqual(custom);
    expect(apiConfig.apiUrl).toBe(custom.apiUrl);
    expect(apiConfig.keysUrl).toBe(custom.keysUrl);
  });

  it("ignores URLs passed in the query string", async () => {
    window.history.replaceState(
      {},
      "",
      "/?apiUrl=https%3A%2F%2Fevil.com&keysUrl=https%3A%2F%2Fevil.com&jsSdkUrl=https%3A%2F%2Fevil.com%2Fv2"
    );
    setMeta(JSON.stringify(custom));
    const { sdkConfig } = await import("../src/utilities/config");
    expect(sdkConfig).toEqual(custom);
  });

  it("falls back to the build-time defaults when the tag is absent", async () => {
    const { sdkConfig } = await import("../src/utilities/config");
    expect(sdkConfig).toEqual(buildTimeSdkConfig(import.meta.env));
  });
});
