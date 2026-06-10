/**
 * @vitest-environment happy-dom
 */

import { vi } from "vitest";
import { loadScript } from "./load-script";

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
      expect.any(Function)
    );
    expect(script.addEventListenerSpy).toHaveBeenCalledWith(
      "error",
      expect.any(Function)
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
});
