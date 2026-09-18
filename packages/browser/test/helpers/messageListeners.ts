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

export function frameMessage(
  container: HTMLElement,
  type: string,
  payload?: unknown
) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { frame: container.querySelector("iframe")?.id, type, payload },
    })
  );
}
