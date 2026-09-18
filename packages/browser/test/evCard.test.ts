import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EV_CARD_TAG_NAME,
  EvCard,
  registerEvCard,
} from "../lib/ui/elements/evCard";
import UIComponents from "../lib/ui";
import type EvervaultClient from "../lib/main";
import type { CardHostConfiguration } from "../lib/ui/cardHost";
import type { CardSpecNode, SelectorType } from "types";

const { frames, FakeCardFrame } = vi.hoisted(() => {
  class FakeCardFrame {
    handlers: Record<string, (payload: unknown) => void> = {};
    mount = vi.fn<
      (selector: SelectorType, configuration: unknown) => FakeCardFrame
    >(() => this);
    update = vi.fn(() => this);
    setSpec = vi.fn(() => this);
    destroy = vi.fn(() => this);
    on = vi.fn((event: string, callback: (payload: unknown) => void) => {
      this.handlers[event] = callback;
      return () => {};
    });

    constructor() {
      frames.push(this);
    }
  }

  const frames: FakeCardFrame[] = [];

  return { frames, FakeCardFrame };
});

vi.mock("../lib/ui/cardHost", () => ({ CardHost: FakeCardFrame }));

vi.mock("themes", () => ({ clean: () => ({ styles: { theme: "clean" } }) }));

const client = { config: {} };
const createClient = vi.fn(() => client as unknown as EvervaultClient);

beforeAll(() => {
  registerEvCard(createClient);
});

afterEach(() => {
  document.body.innerHTML = "";
  frames.length = 0;
  vi.clearAllMocks();
});

function append(attributes: Record<string, string> = {}) {
  const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  document.body.append(element);
  return element;
}

function evervault() {
  return client as unknown as EvervaultClient;
}

function frame() {
  const [latest] = frames.slice(-1);
  if (!latest) throw new Error("no card frame was created");
  return latest;
}

function mountedWith() {
  const [, configuration] = frame().mount.mock.calls[0];
  return configuration as CardHostConfiguration;
}

function types(nodes: CardSpecNode[] | undefined) {
  return nodes?.map((node) => node.type);
}

describe("<ev-card>", () => {
  it("mounts a card frame inside its own closed shadow root", () => {
    const element = append();
    element.mountCard(evervault());

    const [mountPoint] = frame().mount.mock.calls[0];
    const root = (mountPoint as HTMLElement).getRootNode() as ShadowRoot;

    expect(root.host).toBe(element);
    expect(root.mode).toBe("closed");
    expect(element.shadowRoot).toBeNull();
  });

  it("renders nothing of its own in the light DOM", () => {
    const element = append();
    element.mountCard(evervault());

    expect(element.children).toHaveLength(0);
  });

  it("mounts the default card fields when it has no children", () => {
    const element = append();
    element.mountCard(evervault());

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "number",
      "expiry",
      "cvc",
    ]);
  });

  it("mounts with the clean theme", () => {
    const element = append();
    element.mountCard(evervault());

    expect(mountedWith().theme).toEqual({ styles: { theme: "clean" } });
  });

  it("mounts a card from its team-id and app-id attributes", () => {
    append({ "team-id": "team_test123", "app-id": "app_test123" });

    expect(createClient).toHaveBeenCalledWith("team_test123", "app_test123");
    expect(frame().mount).toHaveBeenCalledOnce();
  });

  it("does not mount a card when the attributes are missing", () => {
    append({ "team-id": "team_test123" });

    expect(createClient).not.toHaveBeenCalled();
    expect(frames).toHaveLength(0);
  });

  it("does not mount a second card", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append({
      "team-id": "team_test123",
      "app-id": "app_test123",
    });

    element.mountCard(evervault());

    expect(frames).toHaveLength(1);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("already been mounted")
    );

    error.mockRestore();
  });

  it("destroys the card frame when removed from the DOM", () => {
    const element = append();
    element.mountCard(evervault());
    element.remove();

    expect(frame().destroy).toHaveBeenCalledOnce();
  });

  it("mounts a card again when reconnected", () => {
    const element = append({
      "team-id": "team_test123",
      "app-id": "app_test123",
    });

    element.remove();
    document.body.append(element);

    expect(frames).toHaveLength(2);
    expect(frames[1].mount).toHaveBeenCalledOnce();
  });

  it("mounts a card again when reconnected without attributes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.mountCard(evervault());

    element.remove();
    document.body.append(element);

    expect(frames).toHaveLength(2);
    expect(frames[1].mount).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();

    error.mockRestore();
  });

  it("mounts the reconnected card into the same shadow root", () => {
    const element = append();
    element.mountCard(evervault());

    element.remove();
    document.body.append(element);

    const [first] = frames[0].mount.mock.calls[0];
    const [second] = frames[1].mount.mock.calls[0];

    expect(second).toBe(first);
  });

  it("does not remount a card that was mounted before insertion", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;
    element.mountCard(evervault());

    document.body.append(element);

    expect(frames).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();

    error.mockRestore();
  });

  it("keeps a restored card when mounted again with the same client", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.mountCard(evervault());

    element.remove();
    document.body.append(element);

    element.mountCard(evervault());

    expect(frames).toHaveLength(2);
    expect(frames[1].destroy).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("already been mounted")
    );

    error.mockRestore();
  });

  it("keeps a live card when mounted with another client", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.mountCard(evervault());

    element.mountCard({ config: {} } as unknown as EvervaultClient);

    expect(frames).toHaveLength(1);
    expect(frames[0].destroy).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("already been mounted")
    );

    error.mockRestore();
  });
});

describe("<ev-card> change event", () => {
  it("dispatches a change event carrying the card payload", () => {
    const element = append();
    const listener = vi.fn();
    element.addEventListener("change", listener);

    element.mountCard(evervault());
    frame().handlers.change({ isComplete: true });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual({ isComplete: true });
  });

  it("bubbles the change event out of the element", () => {
    const element = append();
    const listener = vi.fn();
    document.body.addEventListener("change", listener);

    element.mountCard(evervault());
    frame().handlers.change({ isComplete: false });

    expect(listener).toHaveBeenCalledOnce();

    document.body.removeEventListener("change", listener);
  });
});

describe("ui.mount", () => {
  it("mounts every ev-card on the page with the client", () => {
    append();
    append();

    new UIComponents(evervault()).mount();

    expect(frames).toHaveLength(2);
    expect(frames[0].mount).toHaveBeenCalledOnce();
    expect(frames[1].mount).toHaveBeenCalledOnce();
  });
});
