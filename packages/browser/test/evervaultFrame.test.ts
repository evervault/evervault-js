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

describe("EvervaultFrame preload and reveal", () => {
  function container() {
    const element = document.createElement("div");
    document.body.appendChild(element);
    return element;
  }

  it("boots the frame hidden and out of flow", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("hidden");
    expect(frame.iframe.style.position).toBe("absolute");
    expect(frame.iframe.style.top).toBe("0px");
  });

  it("reveals without moving the frame", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);
    const parentBeforeReveal = frame.iframe.parentNode;
    frame.reveal();

    expect(frame.iframe.parentNode).toBe(parentBeforeReveal);
    expect(frame.iframe.style.visibility).toBe("");
    expect(frame.iframe.style.position).toBe("");
    expect(frame.iframe.style.top).toBe("");
  });

  it("throws when revealed without a prior preload", () => {
    const frame = new EvervaultFrame(mockClient, "card");

    expect(() => frame.reveal()).toThrow(/preload/);
  });

  it("ignores a second preload", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();
    const other = container();

    frame.preload(target);
    frame.preload(other);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(other.contains(frame.iframe)).toBe(false);
  });

  it("throws when mounted after preload", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);

    expect(() => frame.mount(target)).toThrow(/already mounted/);
  });

  it("ignores a second reveal", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);
    frame.reveal();

    expect(() => frame.reveal()).not.toThrow();
  });

  it("allows preloading again after unmount", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);
    frame.unmount();
    frame.preload(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("hidden");
  });

  it("leaves mount unchanged when preload is never called", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.mount(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("");
    expect(() => frame.mount(target)).toThrow(/already mounted/);
  });

  it("boots at the container's pixel width while hidden", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);

    expect(frame.iframe.style.width).toBe("400px");
  });

  it("restores width: 100% on reveal", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);
    frame.reveal();

    expect(frame.iframe.style.width).toBe("100%");
  });

  it("keeps a width the frame set itself during the hidden boot", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);
    frame.iframe.style.width = "512px";
    frame.reveal();

    expect(frame.iframe.style.width).toBe("512px");
  });

  it("leaves width alone when the container has no measurable width", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();

    frame.preload(target);

    expect(frame.iframe.style.width).toBe("100%");
  });

  it("restores width: 100% when unmounted while hidden", () => {
    const frame = new EvervaultFrame(mockClient, "card");
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);
    frame.unmount();

    expect(frame.iframe.style.width).toBe("100%");
  });

  describe("with a resizing container", () => {
    let resizeCallbacks: (() => void)[];
    let disconnected: boolean;

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function stubResizeObserver() {
      resizeCallbacks = [];
      disconnected = false;
      vi.stubGlobal(
        "ResizeObserver",
        class {
          constructor(callback: () => void) {
            resizeCallbacks.push(callback);
          }
          observe() {}
          disconnect() {
            disconnected = true;
          }
        }
      );
    }

    it("re-pins the width when the container resizes while hidden", () => {
      stubResizeObserver();
      const frame = new EvervaultFrame(mockClient, "card");
      const target = container();
      Object.defineProperty(target, "clientWidth", {
        value: 400,
        configurable: true,
      });

      frame.preload(target);
      expect(frame.iframe.style.width).toBe("400px");

      Object.defineProperty(target, "clientWidth", { value: 320 });
      resizeCallbacks[0]();

      expect(frame.iframe.style.width).toBe("320px");
    });

    it("keeps the frame's own requested width when the container resizes", () => {
      stubResizeObserver();
      const frame = new EvervaultFrame(mockClient, "card");
      const target = container();
      Object.defineProperty(target, "clientWidth", { value: 400 });

      frame.preload(target);
      frame.iframe.style.width = "512px";

      resizeCallbacks[0]();

      expect(frame.iframe.style.width).toBe("512px");
    });

    it("stops observing on reveal", () => {
      stubResizeObserver();
      const frame = new EvervaultFrame(mockClient, "card");
      const target = container();
      Object.defineProperty(target, "clientWidth", { value: 400 });

      frame.preload(target);
      frame.reveal();

      expect(disconnected).toBe(true);
    });
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
