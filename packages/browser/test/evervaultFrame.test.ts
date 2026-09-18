import { afterEach, describe, expect, it, vi } from "vitest";
import { EvervaultFrame } from "../lib/ui/evervaultFrame";
import type EvervaultClient from "../lib/main";
import type { ThemeUtilities } from "types";
import { countMessageListeners } from "./helpers/messageListeners";

const mockClient = {
  config: {
    appId: "app_test123",
    teamId: "team_test123",
    components: { url: "https://components.evervault.com" },
  },
} as unknown as EvervaultClient;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

describe("EvervaultFrame teardown", () => {
  it("counts a fired once() subscription as released", () => {
    const listeners = countMessageListeners();
    const frame = new EvervaultFrame(mockClient, "card");

    const release = frame.once("EV_FRAME_READY", () => {});

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { frame: frame.iframe.id, type: "EV_FRAME_READY" },
      })
    );

    release();

    expect(listeners()).toBe(0);
  });

  it("releases the listeners it registered when destroyed", () => {
    const listeners = countMessageListeners();
    const frame = new EvervaultFrame(mockClient, "card");
    const container = document.createElement("div");

    frame.mount(container);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { frame: frame.iframe.id, type: "EV_FRAME_HANDSHAKE" },
      })
    );

    // EV_FRAME_HANDSHAKE and EV_FRAME_READY, plus the EV_RESIZE listener the
    // handshake sets up.
    expect(listeners()).toBe(3);

    frame.destroy();

    expect(listeners()).toBe(0);
    expect(container.contains(frame.iframe)).toBe(false);
  });

  it("keeps its listeners when only unmounted", () => {
    const listeners = countMessageListeners();
    const frame = new EvervaultFrame(mockClient, "card");

    frame.mount(document.createElement("div"));
    frame.unmount();

    // threeDSecure and the like unmount mid-lifecycle and carry on listening.
    expect(listeners()).toBe(2);
  });
});

describe("Theme teardown", () => {
  it("releases the media query listeners when the frame is destroyed", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener, removeEventListener }))
    );

    const frame = new EvervaultFrame(mockClient, "card");

    frame.mount(document.createElement("div"), {
      theme: ({ media }) => {
        media("(min-width: 600px)", {});
        return {};
      },
    });

    expect(addEventListener).toHaveBeenCalledOnce();

    frame.destroy();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      addEventListener.mock.calls[0][1]
    );
  });

  it("releases the previous media query listeners when updated", () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();

    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener, removeEventListener }))
    );

    const theme = ({ media }: ThemeUtilities) => {
      media("(min-width: 600px)", {});
      return {};
    };

    const frame = new EvervaultFrame(mockClient, "card");

    frame.mount(document.createElement("div"), { theme });
    frame.update({ theme });

    expect(addEventListener).toHaveBeenCalledTimes(2);
    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});
