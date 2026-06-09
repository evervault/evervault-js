/**
 * @vitest-environment happy-dom
 */

import { Mock, vi } from "vitest";
import { injectScript } from "./inject-script";
import EvervaultClient from "@evervault/browser";

interface CustomWindow extends Window {
  require?: Mock;
  requirejs?: Mock;
  define?: () => void;
}

function define() {}
define.amd = true;

function mockScript() {
  const element = vi.mocked(document.createElement("script"));
  const listeners = {
    load: vi.fn(),
    error: vi.fn(),
  };

  // const originalEvervault = window.Evervault;
  // // Unset the window.Evervault property after the script loads
  // element.addEventListener("load", () => {
  //   window.Evervault = originalEvervault;
  // });

  const addEventListenerSpy = vi
    .spyOn(element, "addEventListener")
    .mockImplementation((type, listener) => {
      const handler =
        typeof listener === "function" ? listener : listener.handleEvent;
      if (type === "error") {
        listeners.error(handler);
      } else if (type === "load") {
        listeners.load(handler);
      }
    });

  function dispatchEvent(type: "load" | "error") {
    const handler = listeners[type].mock.calls[0][0];
    handler(new Event(type));
  }

  return { element, dispatchEvent, addEventListenerSpy };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  window.Evervault = undefined;
  delete window.Evervault;
});

describe("injectScript", () => {
  it("should inject the script", async () => {
    const script = mockScript();
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(script.element);

    const promise = injectScript();
    expect(createElementSpy).toHaveBeenCalledWith("script");
    expect(script.element.parentElement).toBe(document.head);
    expect(script.element.src).toBe("https://js.evervault.com/v2");
    expect(script.addEventListenerSpy).toHaveBeenCalledWith(
      "load",
      expect.any(Function)
    );
    expect(script.addEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
    );

    window.Evervault = EvervaultClient;
    script.dispatchEvent("load");
    await expect(promise).resolves.toBe(EvervaultClient);
  });

  it("should inject the script to body if document.head is not present", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);
    vi.spyOn(document, "head", "get").mockReturnValue(
      null as unknown as HTMLElement
    );

    injectScript();
    expect(script.element.parentElement).toBe(document.body);
  });

  it("should fail if the document.body or document.head is not present", async () => {
    vi.spyOn(document, "body", "get").mockReturnValue(
      null as unknown as HTMLElement
    );
    vi.spyOn(document, "head", "get").mockReturnValue(
      null as unknown as HTMLElement
    );

    const promise = injectScript();
    await expect(promise).rejects.toThrow(
      "Expected document.body not to be null. Evervault.js requires a <body> element."
    );
  });

  it("should fail if script does not load", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript();
    script.dispatchEvent("error");
    await expect(promise).rejects.toThrow("Failed to load Evervault.js");
  });

  it("should fail if script loads but does not expose the Evervault client on window", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript();
    window.Evervault = undefined;
    script.dispatchEvent("load");
    await expect(promise).rejects.toThrow("Evervault.js not available");
  });

  it("should return the cached client if it is already loaded", async () => {
    const createElementSpy = vi.spyOn(document, "createElement");

    window.Evervault = EvervaultClient;
    const promise = injectScript();
    await expect(promise).resolves.toBe(EvervaultClient);
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  describe("AMD support", () => {
    const w = window as unknown as CustomWindow;

    beforeEach(() => {
      w.define = define;
      w.require = vi.fn();
      w.requirejs = vi.fn();
    });

    afterEach(() => {
      delete w.define;
      delete w.require;
      delete w.requirejs;
    });

    it("should inject the script via AMD", () => {
      injectScript();
      expect(w.require).toHaveBeenCalledWith(
        ["https://js.evervault.com/v2"],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should fail if AMD rejects the script", async () => {
      const promise = injectScript();
      expect(w.require).toHaveBeenCalledTimes(1);

      const reject = w.require?.mock.calls[0][2];
      reject?.();

      await expect(promise).rejects.toThrow(
        "Failed to load Evervault.js via AMD"
      );
    });

    it("should fail if AMD does not export the Evervault client", async () => {
      const promise = injectScript();
      expect(w.require).toHaveBeenCalledTimes(1);

      const resolve = w.require?.mock.calls[0][1];
      resolve?.(undefined);

      await expect(promise).rejects.toThrow(
        "Evervault.js AMD module did not export Evervault client"
      );
    });

    it("should succeed if the script loads client successfully", async () => {
      const promise = injectScript();
      expect(w.require).toHaveBeenCalledTimes(1);

      const client = {} as typeof EvervaultClient;
      const resolve = w.require?.mock.calls[0][1];
      resolve?.(client);

      await expect(promise).resolves.toBe(client);
    });

    it("should not inject the script manually if AMD is present", async () => {
      const createElement = vi.spyOn(document, "createElement");

      const promise = injectScript();
      expect(w.require).toHaveBeenCalledTimes(1);
      const client = {} as typeof EvervaultClient;
      const resolve = w.require?.mock.calls[0][1];
      resolve?.(client);

      await expect(promise).resolves.toBe(client);
      expect(createElement).not.toHaveBeenCalled();
    });
  });
});
