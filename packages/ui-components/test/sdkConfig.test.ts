/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTimeSdkConfig,
  resolveSdkConfig,
  type SdkConfig,
} from "../src/utilities/sdkConfig";

const defaults: SdkConfig = {
  jsSdkUrl: "https://js.evervault.com/v2",
  keysUrl: "https://keys.evervault.com",
  apiUrl: "https://api.evervault.com",
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
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

describe("resolveSdkConfig", () => {
  it("uses the defaults on an Evervault origin", () => {
    expect(
      resolveSdkConfig("https://ui-components.evervault.com", defaults)
    ).toBe(defaults);
    expect(
      resolveSdkConfig("https://ui-components.evervault.io", defaults)
    ).toBe(defaults);
  });

  it("uses the defaults on loopback so local development works", () => {
    expect(resolveSdkConfig("http://localhost:4001", defaults)).toBe(defaults);
    expect(resolveSdkConfig("http://127.0.0.1:4001", defaults)).toBe(defaults);
  });

  it("uses the defaults on an opaque origin", () => {
    expect(resolveSdkConfig("null", defaults)).toBe(defaults);
  });

  it("routes by path on a custom domain", () => {
    expect(resolveSdkConfig("https://payments.acme.com", defaults)).toEqual({
      jsSdkUrl: "https://payments.acme.com/ev/v1/js/v2",
      keysUrl: "https://payments.acme.com/ev/v1/keys/",
      apiUrl: "https://payments.acme.com/ev/v1/api",
    });
  });

  it("keeps a custom domain's port", () => {
    expect(
      resolveSdkConfig("https://payments.acme.com:8443", defaults).apiUrl
    ).toBe("https://payments.acme.com:8443/ev/v1/api");
  });

  it("builds a keys URL that keeps its path when resolved against", () => {
    const { keysUrl } = resolveSdkConfig("https://payments.acme.com", defaults);
    expect(new URL("team/apps/app", keysUrl).href).toBe(
      "https://payments.acme.com/ev/v1/keys/team/apps/app"
    );
  });
});

describe("config", () => {
  it("uses the build-time defaults on a loopback origin", async () => {
    const { sdkConfig, apiConfig } = await import("../src/utilities/config");
    expect(sdkConfig).toEqual(buildTimeSdkConfig(import.meta.env));
    expect(apiConfig.apiUrl).toBe(sdkConfig.apiUrl);
    expect(apiConfig.keysUrl).toBe(sdkConfig.keysUrl);
  });

  it("ignores URLs passed in the query string", async () => {
    window.history.replaceState(
      {},
      "",
      "/?apiUrl=https%3A%2F%2Fevil.com&keysUrl=https%3A%2F%2Fevil.com&jsSdkUrl=https%3A%2F%2Fevil.com%2Fv2"
    );
    const { sdkConfig } = await import("../src/utilities/config");
    expect(sdkConfig).toEqual(buildTimeSdkConfig(import.meta.env));
  });
});
