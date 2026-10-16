/**
 * @vitest-environment jsdom
 */

import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrowserFingerprint } from "../src/ThreeDSecure/BrowserFingerprint";
import { ChallengeFrame } from "../src/ThreeDSecure/ChallengeFrame";

function trampolineMessage(source: MessageEventSource | null) {
  return new MessageEvent("message", {
    source,
    data: { event: "ev-3ds-trampoline", cres: null },
  });
}

function sentTypes(postMessage: ReturnType<typeof vi.spyOn>) {
  return postMessage.mock.calls.map(
    (call: unknown[]) => (call[0] as { type?: string }).type
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("ChallengeFrame trampoline", () => {
  function renderChallenge() {
    vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(
      () => undefined
    );
    const postMessage = vi
      .spyOn(window.parent, "postMessage")
      .mockImplementation(() => undefined);
    const { container } = render(
      <ChallengeFrame
        nextAction={{
          type: "challenge",
          url: "https://acs.example",
          creq: "x",
        }}
        onLoad={vi.fn()}
      />
    );
    const frame = container.querySelector("iframe")!;
    return { frame, postMessage };
  }

  it("ignores a result not sent from the challenge frame", () => {
    const { postMessage } = renderChallenge();

    window.dispatchEvent(trampolineMessage(window));
    window.dispatchEvent(trampolineMessage(null));

    expect(sentTypes(postMessage)).not.toContain("EV_FAILURE");
  });

  it("reports a result sent from the challenge frame", () => {
    const { frame, postMessage } = renderChallenge();

    window.dispatchEvent(trampolineMessage(frame.contentWindow));

    expect(sentTypes(postMessage)).toContain("EV_FAILURE");
  });
});

describe("BrowserFingerprint trampoline", () => {
  function renderFingerprint() {
    vi.spyOn(HTMLFormElement.prototype, "submit").mockImplementation(
      () => undefined
    );
    const onComplete = vi.fn();
    const { container } = render(
      <BrowserFingerprint
        action={{
          type: "browser-fingerprint",
          url: "https://acs.example",
          data: "x",
        }}
        onComplete={onComplete}
        onTimeout={vi.fn()}
      />
    );
    const frame = container.querySelector("iframe")!;
    return { frame, onComplete };
  }

  it("ignores a result not sent from the fingerprint frame", () => {
    const { onComplete } = renderFingerprint();

    window.dispatchEvent(trampolineMessage(window));

    expect(onComplete).not.toHaveBeenCalled();
  });

  it("completes on a result sent from the fingerprint frame", () => {
    const { frame, onComplete } = renderFingerprint();

    window.dispatchEvent(trampolineMessage(frame.contentWindow));

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
