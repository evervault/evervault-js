/**
 * @vitest-environment happy-dom
 */

import { vi, afterEach, describe, it, expect } from "vitest";
import { loadScript } from "./load-script";
import { ScriptLoadError } from "./error";

function mockScript(src: string) {
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

  element.src = `${src}`;

  return { element, dispatchEvent, addEventListenerSpy };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();

  window.Evervault = undefined;
  delete window.Evervault;

  const elements = document.querySelectorAll(
    "script[src^='https://js.evervault.com']"
  );
  elements.forEach((element) => {
    element.remove();
  });
});

describe("loadScript", () => {
  it("should inject the script", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = loadScript("https://js.evervault.com/v2");
    script.dispatchEvent("load");
    await expect(promise).resolves.toBeUndefined();
    expect(script.element.parentElement).toBe(document.head);
    expect(script.element.src).toBe("https://js.evervault.com/v2");
    expect(script.addEventListenerSpy).toHaveBeenCalledWith(
      "load",
      expect.any(Function),
      expect.objectContaining({ once: true })
    );
    expect(script.addEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function),
      expect.objectContaining({ once: true })
    );
  });

  it("should fail if the script load fails", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = loadScript("https://js.evervault.com/v2");
    script.dispatchEvent("error");
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "script_error",
        "Failed to load Evervault.js. See the cause for more details."
      )
    );
  });

  it("should inject the script if url is different", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    document.head.appendChild(script.element);

    const newScript = mockScript("https://js.evervault.com/v3");
    vi.spyOn(document, "createElement").mockReturnValue(newScript.element);

    const promise = loadScript("https://js.evervault.com/v3");
    newScript.dispatchEvent("load");
    await expect(promise).resolves.toBeUndefined();

    const elements = document.querySelectorAll<HTMLScriptElement>(
      `script[src^="https://js.evervault.com"]`
    );
    expect(elements).toHaveLength(2);
    expect(elements[0].src).toBe("https://js.evervault.com/v2");
    expect(elements[1].src).toBe("https://js.evervault.com/v3");
  });

  it("should inject the script query params are different", async () => {
    const script = mockScript("https://js.evervault.com/v2?id=og");
    document.head.appendChild(script.element);

    const newScript = mockScript("https://js.evervault.com/v2?id=new");
    vi.spyOn(document, "createElement").mockReturnValue(newScript.element);

    const promise = loadScript("https://js.evervault.com/v2?id=new");
    newScript.dispatchEvent("load");
    await expect(promise).resolves.toBeUndefined();

    const elements = document.querySelectorAll<HTMLScriptElement>(
      `script[src^="https://js.evervault.com"]`
    );
    expect(elements).toHaveLength(2);
    expect(elements[0].src).toBe("https://js.evervault.com/v2?id=og");
    expect(elements[1].src).toBe("https://js.evervault.com/v2?id=new");
  });

  it("should not inject the script if it is already present with same ID", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    document.head.appendChild(script.element);

    const createElementSpy = vi.spyOn(document, "createElement");
    createElementSpy.mockClear();

    const promise = loadScript("https://js.evervault.com/v2");
    script.dispatchEvent("load");

    await expect(promise).resolves.toBeUndefined();
    expect(createElementSpy).not.toHaveBeenCalled();

    const elements = document.querySelectorAll(
      `script[src="https://js.evervault.com/v2"]`
    );
    expect(elements).toHaveLength(1);
  });

  it("should succeed if the script loads before the timeout", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = loadScript("https://js.evervault.com/v2", { timeout: 100 });
    script.dispatchEvent("load");
    await expect(promise).resolves.toBeUndefined();
    expect(script.element.parentElement).toBe(document.head);
    expect(script.element.src).toBe("https://js.evervault.com/v2");
  });

  it("should fail if the script load times out", async () => {
    const script = mockScript("https://js.evervault.com/v2");
    vi.spyOn(document, "createElement").mockReturnValue(script.element);

    const promise = loadScript("https://js.evervault.com/v2", { timeout: 100 });
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "timed_out",
        "Failed to load Evervault.js after 100ms."
      )
    );
  });

  it("should fail if document.head and document.body are not found", async () => {
    vi.spyOn(document, "head", "get").mockReturnValue(
      undefined as unknown as HTMLHeadElement
    );
    vi.spyOn(document, "body", "get").mockReturnValue(
      undefined as unknown as HTMLElement
    );

    const promise = loadScript("https://js.evervault.com/v2");
    await expect(promise).rejects.toThrow(
      new ScriptLoadError(
        "head_or_body_not_found",
        "Expected document.body not to be null. Evervault.js requires a <body> element."
      )
    );
  });
});
