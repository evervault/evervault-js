import { vi } from "vitest";

// Live "message" handlers on the window, counted by identity: once() removes
// its own handler and then again through its unsubscribe, so a balance of add
// and remove calls would read a fired once() as -1.
export function countMessageListeners() {
  const added = vi.spyOn(window, "addEventListener");
  const removed = vi.spyOn(window, "removeEventListener");

  return () => {
    const live = new Set(
      added.mock.calls
        .filter(([event]) => event === "message")
        .map(([, handler]) => handler)
    );

    for (const [event, handler] of removed.mock.calls) {
      if (event === "message") live.delete(handler);
    }

    return live.size;
  };
}

// The frame is named by the container holding its iframe, or by the iframe id
// captured before the iframe was removed.
export function frameMessage(
  target: HTMLElement | string,
  type: string,
  payload?: unknown
) {
  const frame =
    typeof target === "string" ? target : target.querySelector("iframe")?.id;

  window.dispatchEvent(
    new MessageEvent("message", { data: { frame, type, payload } })
  );
}

export function frameId(container: HTMLElement) {
  const id = container.querySelector("iframe")?.id;
  if (!id) throw new Error("no iframe in container");
  return id;
}
