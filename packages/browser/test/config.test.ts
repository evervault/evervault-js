import { describe, expect, it } from "vitest";
import { customHostOrigin } from "shared/customHost";
import EvervaultClient from "../lib/main";
import getConfig from "../lib/config";

describe("customHostOrigin", () => {
  it.each([
    ["payments.acme.com", "https://payments.acme.com"],
    ["Payments.Acme.com", "https://payments.acme.com"],
    ["payments.acme.com:8443", "https://payments.acme.com:8443"],
  ])("accepts %j", (host, origin) => {
    expect(customHostOrigin(host)).toBe(origin);
  });

  it.each([
    "",
    "https://payments.acme.com",
    "payments.acme.com/",
    "payments.acme.com/js",
    "payments.acme.com?x=1",
    "payments.acme.com#x",
    "user@payments.acme.com",
    "payments acme.com",
    "payments.acme.com:port",
    undefined,
    42,
  ])("rejects %j", (host) => {
    expect(customHostOrigin(host)).toBeNull();
  });
});

describe("getConfig", () => {
  it("uses the Evervault hosts without a custom host", () => {
    const config = getConfig("team", "app");

    expect(config.http).toEqual({
      keysUrl: "https://keys.evervault.com",
      apiUrl: "https://api.evervault.com",
    });
    expect(config.components.url).toBe("https://ui-components.evervault.com");
  });

  it("routes every service through a custom host by path", () => {
    const config = getConfig(
      "team",
      "app",
      undefined,
      undefined,
      "https://payments.acme.com"
    );

    expect(config.http).toEqual({
      keysUrl: "https://payments.acme.com/keys/",
      apiUrl: "https://payments.acme.com/api",
    });
    expect(config.components.url).toBe("https://payments.acme.com/");
    expect(config.input.inputsOrigin).toBe("https://inputs.evervault.com");
  });

  it("keys the cage key request under the custom host's keys path", () => {
    const { http } = getConfig(
      "team",
      "app",
      undefined,
      undefined,
      "https://payments.acme.com"
    );

    expect(new URL("team/apps/app", http.keysUrl).href).toBe(
      "https://payments.acme.com/keys/team/apps/app"
    );
  });

  it("prefers an explicit url over the custom host", () => {
    const config = getConfig(
      "team",
      "app",
      { apiUrl: "https://api.acme.com" },
      undefined,
      "https://payments.acme.com"
    );

    expect(config.http.apiUrl).toBe("https://api.acme.com");
    expect(config.http.keysUrl).toBe("https://payments.acme.com/keys/");
  });
});

describe("EvervaultClient host", () => {
  it("throws on a host that is not a hostname", () => {
    expect(
      () =>
        new EvervaultClient("team", "app", {
          host: "https://payments.acme.com",
        })
    ).toThrow("host must be a hostname");
  });
});
