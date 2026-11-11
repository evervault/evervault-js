/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMessaging } from "../src/utilities/useMessaging";

const originalLocation = window.location;

function mockAncestorOrigins(origins?: string[]) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { search: "?id=test-frame", ancestorOrigins: origins },
  });
}

function siblingWindow() {
  const frame = document.createElement("iframe");
  document.body.appendChild(frame);
  return frame.contentWindow!;
}

function dispatch(init: MessageEventInit) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { type: "EV_INIT", payload: { config: {} } },
      ...init,
    })
  );
}

afterEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
  vi.restoreAllMocks();
});

describe("useMessaging on", () => {
  it("does not throw when a postMessage event has no data", () => {
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    expect(() =>
      window.dispatchEvent(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });

  it("ignores a message from a window other than the parent", () => {
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    dispatch({ source: siblingWindow() });
    dispatch({ source: null });

    expect(callback).not.toHaveBeenCalled();
  });

  it("accepts a message from the parent when ancestorOrigins is unavailable", () => {
    mockAncestorOrigins(undefined);
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    dispatch({ source: window, origin: "https://anything.example" });

    expect(callback).toHaveBeenCalledWith({ config: {} });
  });

  it("accepts a message from the parent origin", () => {
    mockAncestorOrigins(["https://merchant.example"]);
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    dispatch({ source: window, origin: "https://merchant.example" });

    expect(callback).toHaveBeenCalledOnce();
  });

  it("ignores a message from the parent window with the wrong origin", () => {
    mockAncestorOrigins(["https://merchant.example"]);
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    dispatch({ source: window, origin: "https://attacker.example" });

    expect(callback).not.toHaveBeenCalled();
  });

  it("checks only the source when the parent origin is hidden", () => {
    mockAncestorOrigins(["null"]);
    const { result } = renderHook(() => useMessaging());
    const callback = vi.fn();
    result.current.on("EV_INIT", callback);

    dispatch({ source: window, origin: "https://merchant.example" });

    expect(callback).toHaveBeenCalledOnce();
  });
});

describe("useMessaging send", () => {
  it("targets the parent origin", () => {
    mockAncestorOrigins(["https://merchant.example"]);
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useMessaging());

    result.current.send("EV_FRAME_READY");

    expect(postMessage).toHaveBeenCalledWith(
      { frame: "test-frame", type: "EV_FRAME_READY", payload: undefined },
      "https://merchant.example"
    );
  });

  it.each([[undefined], [["null"]]])(
    "falls back to any origin when the parent origin is %j",
    (origins) => {
      mockAncestorOrigins(origins);
      const postMessage = vi
        .spyOn(window.parent, "postMessage")
        .mockImplementation(() => undefined);
      const { result } = renderHook(() => useMessaging());

      result.current.send("EV_FRAME_READY");

      expect(postMessage).toHaveBeenCalledWith(expect.anything(), "*");
    }
  );
});
