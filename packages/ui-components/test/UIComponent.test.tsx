/**
 * @vitest-environment jsdom
 */

import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UIComponent } from "../src/UIComponent";

vi.mock("../src/Card", () => ({
  Card: () => <div>card</div>,
}));

function dispatchInit(config: unknown) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { frame: "test-frame", type: "EV_INIT", payload: { config } },
    })
  );
}

function dispatchUpdate(config: unknown) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { frame: "test-frame", type: "EV_UPDATE", payload: { config } },
    })
  );
}

function readyMessagesSent(postMessage: ReturnType<typeof vi.spyOn>) {
  return postMessage.mock.calls.filter(
    (call: unknown[]) =>
      (call[0] as { type?: string })?.type === "EV_FRAME_READY"
  ).length;
}

describe("UIComponent EV_FRAME_READY timing", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "?component=Card&id=test-frame");
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("waits for the lazy component chunk to resolve before signalling ready", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    render(<UIComponent />);

    act(() => {
      dispatchInit({});
    });

    expect(readyMessagesSent(postMessage)).toBe(0);

    await waitFor(() => {
      expect(readyMessagesSent(postMessage)).toBe(1);
    });
  });

  it("does not re-signal ready when config is updated after the component has already loaded", async () => {
    const postMessage = vi.spyOn(window.parent, "postMessage");
    render(<UIComponent />);

    act(() => {
      dispatchInit({});
    });

    await waitFor(() => {
      expect(readyMessagesSent(postMessage)).toBe(1);
    });

    act(() => {
      dispatchUpdate({});
    });

    expect(readyMessagesSent(postMessage)).toBe(1);
  });
});
