/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMessaging } from "../src/utilities/useMessaging";

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
});
