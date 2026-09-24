import { describe, expect, it, vi } from "vitest";
import {
  isSecureOrigin,
  resolveAgentToolsConfig,
  slugify,
} from "../lib/ui/agentTools";
import Card from "../lib/ui/card";
import type EvervaultClient from "../lib/main";

const mockClient = {
  config: {
    appId: "app_test123",
    teamId: "team_test123",
    components: { url: "https://components.evervault.com" },
  },
} as unknown as EvervaultClient;

describe("resolveAgentToolsConfig", () => {
  it("returns undefined when not enabled", () => {
    expect(resolveAgentToolsConfig(undefined, "app_x")).toBeUndefined();
    expect(
      resolveAgentToolsConfig({ enabled: false, namePrefix: "acme" }, "app_x")
    ).toBeUndefined();
  });

  it("slugifies the configured prefix", () => {
    const resolved = resolveAgentToolsConfig(
      { enabled: true, namePrefix: "Acme Pay!" },
      "app_x"
    );
    expect(resolved?.namePrefix).toBe("acme-pay");
  });

  it("derives an unbranded prefix and product name by default", () => {
    const resolved = resolveAgentToolsConfig({ enabled: true }, "app_test123");
    expect(resolved?.namePrefix).toBe("app-test123");
    expect(resolved?.productName.toLowerCase()).not.toContain("evervault");
    expect(resolved?.namePrefix).not.toContain("evervault");
  });

  it("defaults exposeTo to the current origin", () => {
    const resolved = resolveAgentToolsConfig({ enabled: true }, "app_x");
    expect(resolved?.exposeTo).toEqual([window.location.origin]);
  });

  it("warns when every requested origin is filtered out", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const resolved = resolveAgentToolsConfig(
      { enabled: true, exposeTo: ["http://merchant.example", "nope"] },
      "app_x"
    );
    expect(resolved?.exposeTo).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("http://merchant.example");
    warn.mockRestore();
  });

  it("drops insecure and malformed origins", () => {
    const resolved = resolveAgentToolsConfig(
      {
        enabled: true,
        exposeTo: [
          "https://merchant.example",
          "http://merchant.example",
          "https://merchant.example/path",
          "not a url",
          "https://merchant.example",
        ],
      },
      "app_x"
    );
    expect(resolved?.exposeTo).toEqual(["https://merchant.example"]);
  });
});

describe("helpers", () => {
  it("slugify", () => {
    expect(slugify("  Acme__Pay 2 ")).toBe("acme-pay-2");
    expect(slugify("!!!")).toBe("");
  });

  it("isSecureOrigin", () => {
    expect(isSecureOrigin("https://a.example")).toBe(true);
    expect(isSecureOrigin("http://localhost:3000")).toBe(true);
    expect(isSecureOrigin("http://a.example")).toBe(false);
  });
});

describe("Card agentTools", () => {
  it("does not change the iframe allow attribute when disabled", () => {
    const card = new Card(mockClient);
    expect(card.config.config.agentTools).toBeUndefined();
    const iframe = document.querySelector("iframe");
    expect(iframe).toBeNull();
  });

  it("delegates the tools permissions policy when enabled", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);

    const card = new Card(mockClient, {
      agentTools: { enabled: true, namePrefix: "acmepay" },
    });
    card.mount(target);

    const iframe = target.querySelector("iframe");
    expect(iframe?.allow).toBe("payment; tools");
    expect(card.config.config.agentTools).toEqual({
      namePrefix: "acmepay",
      productName: "the secure card form",
      exposeTo: [window.location.origin],
    });

    card.unmount();
  });
});
