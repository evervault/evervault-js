import { describe, expect, it, vi } from "vitest";
import { EvervaultFrame } from "../lib/ui/evervaultFrame";
import type EvervaultClient from "../lib/main";

const mockClient = {
  config: {
    appId: "app_test123",
    teamId: "team_test123",
    components: { url: "https://components.evervault.com" },
  },
} as unknown as EvervaultClient;

describe("EvervaultFrame message listeners", () => {
  it("does not throw when a postMessage event has no data (on)", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const callback = vi.fn();
    frame.on("EV_FRAME_READY", callback);

    expect(() =>
      window.dispatchEvent(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not throw when a postMessage event has no data (once)", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const callback = vi.fn();
    frame.once("EV_FRAME_READY", callback);

    expect(() =>
      window.dispatchEvent(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });
});
