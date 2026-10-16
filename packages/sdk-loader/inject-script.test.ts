/**
 * @vitest-environment happy-dom
 */

import { Mock, vi, afterEach, describe, it, expect, beforeEach } from "vitest";
import { injectScript, resetScriptLoads } from "./inject-script";
import { ScriptLoadError } from "./error";

class EvervaultClient {}

const w = window as unknown as { Evervault?: unknown };

interface CustomWindow extends Window {
  require?: Mock;
  requirejs?: Mock;
  define?: () => void;
}

function define() {}
define.amd = true;

function mockScript(src = "https://js.evervault.com/v2") {
  const element = vi.mocked(document.createElement("script"));
  const listeners = {
    load: vi.fn(),
    error: vi.fn(),
  };

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
    const handler = listeners[type].mock.calls.at(0)?.at(0);
    handler?.(new Event(type));
  }

  element.src = src;

  return { element, dispatchEvent, addEventListenerSpy };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  resetScriptLoads();

  w.Evervault = undefined;
  delete w.Evervault;

  const elements = document.querySelectorAll(
    "script[src^='https://js.evervault.com']"
  );
  elements.forEach((element) => {
    element.remove();
  });
});

describe("injectScript", () => {
  it("should inject the script", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2");
    w.Evervault = EvervaultClient;
    script.dispatchEvent("load");
    await expect(promise).resolves.toBe(EvervaultClient);
  });

  it("should inject the script to body if document.head is not present", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);
    vi.spyOn(document, "head", "get").mockReturnValue(
      null as unknown as HTMLElement
    );

    injectScript("https://js.evervault.com/v2");
    expect(script.element.parentElement).toBe(document.body);
  });

  it("should fail if the document.body or document.head is not present", async () => {
    vi.spyOn(document, "body", "get").mockReturnValue(
      null as unknown as HTMLElement
    );
    vi.spyOn(document, "head", "get").mockReturnValue(
      null as unknown as HTMLElement
    );

    const promise = injectScript("https://js.evervault.com/v2");
    await expect(promise).rejects.toThrow(
      "Expected document.body not to be null. Evervault.js requires a <body> element."
    );
  });

  it("should fail if script does not load", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2");
    script.dispatchEvent("error");
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "script_error",
        "Failed to load Evervault.js. See the cause for more details."
      )
    );
  });

  it("should fail if script loads but does not expose the Evervault client on window", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2");
    w.Evervault = undefined;
    script.dispatchEvent("load");
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "evervault_not_available",
        "Evervault.js script did not load Evervault client."
      )
    );
  });

  it("should return the cached client if it is already loaded", async () => {
    const createElementSpy = vi.spyOn(document, "createElement");

    w.Evervault = EvervaultClient;
    const promise = injectScript("https://js.evervault.com/v2");
    await expect(promise).resolves.toBe(EvervaultClient);
    expect(createElementSpy).not.toHaveBeenCalled();
  });

  it("should ignore an existing global when a url was asked for", async () => {
    const script = mockScript("https://js.evervault.com/v3");
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    w.Evervault = EvervaultClient;
    const promise = injectScript("https://js.evervault.com/v3", {
      reuseExistingClient: false,
    });

    const custom = class CustomBundleClient {};
    w.Evervault = custom;
    script.dispatchEvent("load");

    await expect(promise).resolves.toBe(custom);
  });

  it("should share one load between concurrent callers for the same url", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const first = injectScript("https://js.evervault.com/v2", {
      reuseExistingClient: false,
    });
    const second = injectScript("https://js.evervault.com/v2", {
      reuseExistingClient: false,
    });
    expect(first).toBe(second);

    w.Evervault = EvervaultClient;
    script.dispatchEvent("load");

    await expect(Promise.all([first, second])).resolves.toEqual([
      EvervaultClient,
      EvervaultClient,
    ]);
    expect(
      document.querySelectorAll('script[src="https://js.evervault.com/v2"]')
    ).toHaveLength(1);
  });

  it("should prefer an existing global over a bundle it already loaded", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const speculative = injectScript("https://js.evervault.com/v2");
    w.Evervault = EvervaultClient;
    script.dispatchEvent("load");
    await expect(speculative).resolves.toBe(EvervaultClient);

    const pageClient = class PageClient {};
    w.Evervault = pageClient;

    await expect(injectScript("https://js.evervault.com/v2")).resolves.toBe(
      pageClient
    );
  });

  it("should retry after a failed load", async () => {
    const failing = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(failing.element);

    const first = injectScript("https://js.evervault.com/v2", {
      reuseExistingClient: false,
    });
    failing.dispatchEvent("error");
    await expect(first).rejects.toThrow(ScriptLoadError);
    expect(
      document.querySelectorAll('script[src="https://js.evervault.com/v2"]')
    ).toHaveLength(0);

    const retry = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(retry.element);

    const second = injectScript("https://js.evervault.com/v2", {
      reuseExistingClient: false,
    });
    w.Evervault = EvervaultClient;
    retry.dispatchEvent("load");

    await expect(second).resolves.toBe(EvervaultClient);
  });

  it("should resolve the promise if the script loads before the timeout is reached", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2", {
      timeout: 100,
    });
    w.Evervault = EvervaultClient;
    script.dispatchEvent("load");
    await expect(promise).resolves.toBe(EvervaultClient);
  });

  it("should reject the promise if the script load times out", async () => {
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2", {
      timeout: 100,
    });
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "timed_out",
        "Failed to load Evervault.js after 100ms."
      )
    );
  });

  it("should time out a load the caller did not bound", async () => {
    vi.useFakeTimers();
    const script = mockScript();
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = injectScript("https://js.evervault.com/v2");
    const rejects = expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "timed_out",
        "Failed to load Evervault.js after 15000ms."
      )
    );

    await vi.advanceTimersByTimeAsync(15_000);
    await rejects;
    vi.useRealTimers();
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
      injectScript("https://js.evervault.com/v2");
      expect(w.require).toHaveBeenCalledWith(
        ["https://js.evervault.com/v2"],
        expect.any(Function),
        expect.any(Function)
      );
    });

    it("should fail if AMD rejects the script", async () => {
      const promise = injectScript("https://js.evervault.com/v2");
      expect(w.require).toHaveBeenCalledTimes(1);

      const error = new Error("AMD error");
      const reject = w.require?.mock.calls[0][2];
      reject?.(error);

      await expect(promise).rejects.toThrow(
        new ScriptLoadError(
          "amd_module_error",
          "Failed to load Evervault.js via AMD require. See the cause for more details.",
          {
            cause: error,
          }
        )
      );
    });

    it("should fail if AMD does not export the Evervault client", async () => {
      const promise = injectScript("https://js.evervault.com/v2");
      expect(w.require).toHaveBeenCalledTimes(1);

      const resolve = w.require?.mock.calls[0][1];
      resolve?.(undefined);

      await expect(promise).rejects.toThrow(
        new ScriptLoadError(
          "amd_module_not_exported",
          "Evervault.js AMD module did not export Evervault client."
        )
      );
    });

    it("should succeed if the script loads client successfully", async () => {
      const promise = injectScript("https://js.evervault.com/v2");
      expect(w.require).toHaveBeenCalledTimes(1);

      const client = {};
      const resolve = w.require?.mock.calls[0][1];
      resolve?.(client);

      await expect(promise).resolves.toBe(client);
    });

    it("should not inject the script manually if AMD is present", async () => {
      const createElement = vi.spyOn(document, "createElement");

      const promise = injectScript("https://js.evervault.com/v2");
      expect(w.require).toHaveBeenCalledTimes(1);
      const client = {};
      const resolve = w.require?.mock.calls[0][1];
      resolve?.(client);

      await expect(promise).resolves.toBe(client);
      expect(createElement).not.toHaveBeenCalled();
    });
  });
});
