/**
 * @vitest-environment jsdom
 */

import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBroadcastChannel } from "../src/utilities/useBroadcastChannel";

describe("useBroadcastChannel on", () => {
  it("does not throw when a broadcast message has no data", () => {
    const addEventListenerSpy = vi.spyOn(
      BroadcastChannel.prototype,
      "addEventListener"
    );

    const { result } = renderHook(() =>
      useBroadcastChannel<{ SOME_EVENT: undefined }>("test-channel")
    );
    const callback = vi.fn();
    result.current.on("SOME_EVENT", callback);

    const handler = addEventListenerSpy.mock.calls[0][1] as (
      event: MessageEvent
    ) => void;

    expect(() =>
      handler(new MessageEvent("message", { data: null }))
    ).not.toThrow();
    expect(callback).not.toHaveBeenCalled();
  });
});
