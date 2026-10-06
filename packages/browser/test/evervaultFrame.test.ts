import { afterEach, describe, expect, it, vi } from "vitest";
import { EvervaultFrame } from "../lib/ui/evervaultFrame";
import { Theme } from "../lib/ui/theme";
import type { ThemeUtilities } from "types";
import {
  countMessageListeners,
  frameMessage,
} from "./helpers/messageListeners";
import { client } from "./helpers/client";
import type EvervaultClient from "../lib/main";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("EvervaultFrame message listeners", () => {
  it("does not throw when a postMessage event has no data (on)", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const callback = vi.fn();
    frame.on("EV_FRAME_READY", callback);

    expect(() =>
      window.dispatchEvent(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  it("does not throw when a postMessage event has no data (once)", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const callback = vi.fn();
    frame.once("EV_FRAME_READY", callback);

    expect(() =>
      window.dispatchEvent(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("EvervaultFrame message source and origin", () => {
  function mountedFrame(frameClient = client) {
    const frame = new EvervaultFrame(frameClient, "card", {});
    document.body.appendChild(frame.iframe);
    return frame;
  }

  function dispatch(frame: EvervaultFrame, init: MessageEventInit) {
    window.dispatchEvent(
      new MessageEvent("message", {
        source: frame.iframe.contentWindow,
        origin: "https://ui-components.evervault.com",
        data: { frame: frame.iframe.id, type: "EV_FRAME_READY" },
        ...init,
      })
    );
  }

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("accepts a message from its own frame (on)", () => {
    const frame = mountedFrame();
    const callback = vi.fn();
    frame.on("EV_FRAME_READY", callback);

    dispatch(frame, {});

    expect(callback).toHaveBeenCalledOnce();
  });

  it("accepts a message from its own frame (once)", () => {
    const frame = mountedFrame();
    const callback = vi.fn();
    frame.once("EV_FRAME_READY", callback);

    dispatch(frame, {});
    dispatch(frame, {});

    expect(callback).toHaveBeenCalledOnce();
  });

  it.each(["on", "once"] as const)(
    "ignores the right frame ID from another window (%s)",
    (method) => {
      const frame = mountedFrame();
      const other = mountedFrame();
      const callback = vi.fn();
      frame[method]("EV_FRAME_READY", callback);

      dispatch(frame, { source: window });
      dispatch(frame, { source: other.iframe.contentWindow });
      dispatch(frame, { source: null });

      expect(callback).not.toHaveBeenCalled();
    }
  );

  it.each(["on", "once"] as const)(
    "ignores the right frame ID and source from the wrong origin (%s)",
    (method) => {
      const frame = mountedFrame();
      const callback = vi.fn();
      frame[method]("EV_FRAME_READY", callback);

      dispatch(frame, { origin: "https://attacker.example" });

      expect(callback).not.toHaveBeenCalled();
    }
  );

  it("ignores messages when the frame is not mounted", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const callback = vi.fn();
    frame.on("EV_FRAME_READY", callback);

    dispatch(frame, { source: null });

    expect(callback).not.toHaveBeenCalled();
  });

  it("expects the origin of a custom components URL", () => {
    const customClient = {
      config: {
        ...client.config,
        components: { url: "https://pay.merchant.example/components/" },
      },
    } as unknown as EvervaultClient;
    const frame = mountedFrame(customClient);
    const callback = vi.fn();
    frame.on("EV_FRAME_READY", callback);

    dispatch(frame, { origin: "https://ui-components.evervault.com" });
    dispatch(frame, { origin: "https://pay.merchant.example" });

    expect(callback).toHaveBeenCalledOnce();
  });
});

describe("EvervaultFrame preload and show", () => {
  function container() {
    const element = document.createElement("div");
    document.body.appendChild(element);
    return element;
  }

  it("boots the frame hidden and out of flow", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("hidden");
    expect(frame.iframe.style.position).toBe("absolute");
    expect(frame.iframe.style.top).toBe("0px");
  });

  it("shows without moving the frame", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);
    const parentBeforeShow = frame.iframe.parentNode;
    frame.show();

    expect(frame.iframe.parentNode).toBe(parentBeforeShow);
    expect(frame.iframe.style.visibility).toBe("");
    expect(frame.iframe.style.position).toBe("");
    expect(frame.iframe.style.top).toBe("");
  });

  it("throws when shown without a prior preload", () => {
    const frame = new EvervaultFrame(client, "card", {});

    expect(() => frame.show()).toThrow(/preload/);
  });

  it("ignores a second preload", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();
    const other = container();

    frame.preload(target);
    frame.preload(other);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(other.contains(frame.iframe)).toBe(false);
  });

  it("throws when mounted after preload", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);

    expect(() => frame.mount(target)).toThrow(/already mounted/);
  });

  it("ignores a second show", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);
    frame.show();

    expect(() => frame.show()).not.toThrow();
  });

  it("allows preloading again after unmount", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);
    frame.unmount();
    frame.preload(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("hidden");
  });

  it("preloads nothing once destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.destroy();
    frame.preload(target);

    expect(target.contains(frame.iframe)).toBe(false);
    expect(frame.isMounted).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
  });

  it("shows nothing once destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);
    frame.destroy();

    expect(() => frame.show()).not.toThrow();
    expect(frame.isMounted).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
  });

  it("leaves mount unchanged when preload is never called", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.mount(target);

    expect(target.contains(frame.iframe)).toBe(true);
    expect(frame.iframe.style.visibility).toBe("");
    expect(() => frame.mount(target)).toThrow(/already mounted/);
  });

  it("boots at the container's pixel width while hidden", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);

    expect(frame.iframe.style.width).toBe("400px");
  });

  it("restores width: 100% on show", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);
    frame.show();

    expect(frame.iframe.style.width).toBe("100%");
  });

  it("keeps a width the frame set itself during the hidden boot", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();
    Object.defineProperty(target, "clientWidth", { value: 400 });

    frame.preload(target);
    frame.iframe.style.width = "512px";
    frame.show();

    expect(frame.iframe.style.width).toBe("512px");
  });

  it("leaves width alone when the container has no measurable width", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const target = container();

    frame.preload(target);

    expect(frame.iframe.style.width).toBe("100%");
  });

  it("restores width: 100% when unmounted while hidden", () => {
    const frame = new EvervaultFrame(client, "card", {});
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
      const frame = new EvervaultFrame(client, "card", {});
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
      const frame = new EvervaultFrame(client, "card", {});
      const target = container();
      Object.defineProperty(target, "clientWidth", { value: 400 });

      frame.preload(target);
      frame.iframe.style.width = "512px";

      resizeCallbacks[0]();

      expect(frame.iframe.style.width).toBe("512px");
    });

    it("stops observing on show", () => {
      stubResizeObserver();
      const frame = new EvervaultFrame(client, "card", {});
      const target = container();
      Object.defineProperty(target, "clientWidth", { value: 400 });

      frame.preload(target);
      frame.show();

      expect(disconnected).toBe(true);
    });
  });
});

describe("EvervaultFrame teardown", () => {
  it("counts a fired once() subscription as released", () => {
    const frame = new EvervaultFrame(client, "card", {});
    document.body.append(frame.iframe);
    const listeners = countMessageListeners();
    const callback = vi.fn();

    frame.once("EV_FRAME_READY", callback);

    frameMessage(frame.iframe.id, "EV_FRAME_READY");
    frameMessage(frame.iframe.id, "EV_FRAME_READY");

    expect(callback).toHaveBeenCalledOnce();
    expect(listeners()).toBe(0);
    frame.iframe.remove();
  });

  it("releases the listeners it registered when destroyed", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const listeners = countMessageListeners();
    const container = document.createElement("div");

    frame.mount(container);

    window.dispatchEvent(
      new MessageEvent("message", {
        data: { frame: frame.iframe.id, type: "EV_FRAME_HANDSHAKE" },
      })
    );

    // The handshake and resize listeners.
    expect(listeners()).toBe(2);

    frame.destroy();

    expect(listeners()).toBe(0);
    expect(container.contains(frame.iframe)).toBe(false);
  });

  it("releases only the mount listeners when unmounted", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const listeners = countMessageListeners();
    frame.on("EV_FRAME_READY", () => {});

    frame.mount(document.createElement("div"));
    expect(listeners()).toBe(3);

    frame.unmount();

    // threeDSecure and the like unmount mid-lifecycle and carry on listening.
    expect(listeners()).toBe(1);
  });

  it("is ready when a component's own ready listener runs", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const container = document.createElement("div");
    document.body.append(container);
    let sent: unknown;

    frame.on("EV_FRAME_READY", () => {
      frame.update({ config: { updated: true } });
    });
    frame.mount(container);

    const target = container.querySelector("iframe")?.contentWindow;
    if (!target) throw new Error("no frame window");
    vi.spyOn(target, "postMessage").mockImplementation((data) => {
      sent = data;
    });

    frameMessage(container, "EV_FRAME_READY");

    expect(sent).toEqual({
      type: "EV_UPDATE",
      payload: { theme: undefined, config: { updated: true } },
    });
    container.remove();
  });

  it("registers no listeners of its own on a handshake", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const listeners = countMessageListeners();
    const container = document.createElement("div");

    frame.mount(container);
    frameMessage(container, "EV_FRAME_HANDSHAKE");
    frameMessage(container, "EV_FRAME_HANDSHAKE");

    expect(listeners()).toBe(2);
  });

  it("is not ready again until the remounted frame says so", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const container = document.createElement("div");
    document.body.append(container);

    frame.mount(container);
    frameMessage(container, "EV_FRAME_READY");
    frame.unmount();
    frame.mount(container);

    const target = container.querySelector("iframe")?.contentWindow;
    if (!target) throw new Error("no frame window");
    const posted = vi.spyOn(target, "postMessage");

    frame.update({ config: {} });
    expect(posted).not.toHaveBeenCalled();

    frameMessage(container, "EV_FRAME_READY");
    frame.update({ config: {} });
    expect(posted).toHaveBeenCalledOnce();
    container.remove();
  });

  it("releases a theme given before mounting when it mounts", () => {
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

    const frame = new EvervaultFrame(client, "card", {});
    frame.update({ theme });
    frame.mount(document.createElement("div"), { theme });

    expect(removeEventListener).toHaveBeenCalledOnce();
  });

  it("sizes the iframe from the frame's resize messages", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const container = document.createElement("div");
    document.body.append(container);

    frame.mount(container);
    frameMessage(container, "EV_RESIZE", {
      height: 120,
      width: 300,
      minWidth: 200,
      minHeight: 40,
    });

    expect(frame.iframe.style.height).toBe("120px");
    expect(frame.iframe.style.width).toBe("300px");
    expect(frame.iframe.style.minWidth).toBe("200px");
    expect(frame.iframe.style.minHeight).toBe("40px");
    container.remove();
  });

  it("keeps a fixed size against the frame's resize messages", () => {
    const frame = new EvervaultFrame(
      client,
      "card",
      {},
      { size: { width: "400px", height: "500px" } }
    );
    const container = document.createElement("div");
    document.body.append(container);

    frame.mount(container);
    frameMessage(container, "EV_RESIZE", { height: 120, width: 300 });

    expect(frame.iframe.style.height).toBe("500px");
    expect(frame.iframe.style.width).toBe("400px");
    container.remove();
  });

  it("destroys once however often it is asked", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const listeners = countMessageListeners();
    const frame = new EvervaultFrame(client, "card", {});

    frame.mount(document.createElement("div"));
    frame.destroy();
    frame.destroy();

    expect(error).not.toHaveBeenCalled();
    expect(listeners()).toBe(0);
  });

  it("lets a once() callback subscribe again", () => {
    const frame = new EvervaultFrame(client, "card", {});
    document.body.append(frame.iframe);
    const second = vi.fn();

    frame.once("EV_FRAME_READY", () => {
      frame.once("EV_FRAME_READY", second);
    });

    frameMessage(frame.iframe.id, "EV_FRAME_READY");
    frameMessage(frame.iframe.id, "EV_FRAME_READY");

    expect(second).toHaveBeenCalledOnce();
    frame.iframe.remove();
  });

  it("sends nothing once destroyed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const frame = new EvervaultFrame(client, "card", {});
    const container = document.createElement("div");
    document.body.append(container);

    frame.mount(container);
    const target = container.querySelector("iframe")?.contentWindow;
    if (!target) throw new Error("no frame window");
    const posted = vi.spyOn(target, "postMessage");

    frame.destroy();
    frame.send("EV_INIT", {});

    expect(posted).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("destroyed"));
    container.remove();
  });

  it("releases the previous theme when mounted again", () => {
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

    const frame = new EvervaultFrame(client, "card", {});
    frame.mount(document.createElement("div"), { theme });
    frame.unmount();
    frame.mount(document.createElement("div"), { theme });

    expect(removeEventListener).toHaveBeenCalledOnce();
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

    const frame = new EvervaultFrame(client, "card", {});

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

  it("drops what the previous definition extended when updated", () => {
    const frame = new EvervaultFrame(client, "card", {});
    const theme = new Theme(frame, ({ extend }) => {
      extend({ styles: { label: { color: "red" } } });
      return {};
    });

    theme.update({});

    expect(theme.compile().styles).toEqual({});
  });

  it("drops the previous breakpoints when updated", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );

    const frame = new EvervaultFrame(client, "card", {});
    const theme = new Theme(frame, ({ media }) => {
      media("(min-width: 600px)", { fontSize: "20px" });
      return {};
    });

    theme.update({});

    expect(theme.compile().styles).toEqual({});
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

    const frame = new EvervaultFrame(client, "card", {});

    frame.mount(document.createElement("div"), { theme });
    frame.update({ theme });

    expect(addEventListener).toHaveBeenCalledTimes(2);
    expect(removeEventListener).toHaveBeenCalledOnce();
  });
});
