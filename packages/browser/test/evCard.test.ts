import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EV_CARD_TAG_NAME,
  EvCard,
  registerEvCard,
} from "../lib/ui/elements/evCard";
import UIComponents from "../lib/ui";
import type EvervaultClient from "../lib/main";
import { CardHost } from "../lib/ui/cardHost";
import type { CardHostConfiguration } from "../lib/ui/cardHost";
import { serialise } from "../lib/ui/elements/spec";
import { countMessageListeners } from "./helpers/messageListeners";
import type { CardSpecNode, SelectorType } from "types";

// The fake stands in for the card frame in most tests; the teardown tests
// switch to the real one, since only it registers window listeners to count.
const { hosts, real, FakeCardHost } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const real: { CardHost?: new (...args: any[]) => unknown } = {};

  class FakeCardHost {
    options: unknown;
    handlers: Record<string, (payload: unknown) => void> = {};
    mount = vi.fn<
      (selector: SelectorType, configuration: unknown) => FakeCardHost
    >(() => this);
    update = vi.fn(() => this);
    setSpec = vi.fn(() => this);
    destroy = vi.fn(() => this);
    on = vi.fn((event: string, callback: (payload: unknown) => void) => {
      this.handlers[event] = callback;
      return () => {};
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      if (real.CardHost) return new real.CardHost(...args) as FakeCardHost;

      this.options = args[1];
      hosts.push(this);
    }
  }

  const hosts: FakeCardHost[] = [];

  return { hosts, real, FakeCardHost };
});

vi.mock("../lib/ui/cardHost", () => ({ CardHost: FakeCardHost }));

vi.mock("themes", () => ({
  clean: () => ({ styles: { theme: "clean" } }),
  material: () => ({ styles: { theme: "material" } }),
  minimal: () => ({ styles: { theme: "minimal" } }),
}));

vi.mock("../lib/ui/elements/spec", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../lib/ui/elements/spec")
  >();

  return { ...actual, serialise: vi.fn(actual.serialise) };
});

const client = { config: {} };
const createClient = vi.fn(() => client as unknown as EvervaultClient);

beforeAll(() => {
  registerEvCard(createClient);
});

afterEach(() => {
  document.body.innerHTML = "";
  hosts.length = 0;
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
  const [latest] = hosts.slice(-1);
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

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function lastSpec() {
  const calls = frame().setSpec.mock.calls as unknown as [CardSpecNode[]][];
  return calls[calls.length - 1]?.[0];
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

    const fields = mountedWith().config?.fields as CardSpecNode[];

    expect(types(fields)).toEqual(["number", "row"]);
    expect(types(fields[1].children)).toEqual(["expiry", "cvc"]);
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
    expect(hosts).toHaveLength(0);
  });

  it("does not mount a card when an attribute is empty", () => {
    append({ "team-id": "team_test123", "app-id": "" });

    expect(createClient).not.toHaveBeenCalled();
    expect(hosts).toHaveLength(0);
  });

  it("does not mount a second card", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append({
      "team-id": "team_test123",
      "app-id": "app_test123",
    });

    element.mountCard(evervault());

    expect(hosts).toHaveLength(1);
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

    expect(hosts).toHaveLength(2);
    expect(hosts[1].mount).toHaveBeenCalledOnce();
    expect(createClient).toHaveBeenCalledOnce();
  });

  it("mounts a card again when reconnected without attributes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.mountCard(evervault());

    element.remove();
    document.body.append(element);

    expect(hosts).toHaveLength(2);
    expect(hosts[1].mount).toHaveBeenCalledOnce();
    expect(error).not.toHaveBeenCalled();

    error.mockRestore();
  });

  it("mounts the reconnected card into the same shadow root", () => {
    const element = append();
    element.mountCard(evervault());

    element.remove();
    document.body.append(element);

    const [first] = hosts[0].mount.mock.calls[0];
    const [second] = hosts[1].mount.mock.calls[0];

    expect(second).toBe(first);
  });

  it("does not remount a card that was mounted before insertion", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;
    element.mountCard(evervault());

    document.body.append(element);

    expect(hosts).toHaveLength(1);
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

    expect(hosts).toHaveLength(2);
    expect(hosts[1].destroy).not.toHaveBeenCalled();
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

    expect(hosts).toHaveLength(1);
    expect(hosts[0].destroy).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("already been mounted")
    );

    error.mockRestore();
  });
});

describe("<ev-card> declared children", () => {
  it("mounts the card with the declared children as its tree", () => {
    const element = append();
    element.innerHTML =
      "<ev-card-cvc></ev-card-cvc><ev-card-number></ev-card-number>";
    element.mountCard(evervault());

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "cvc",
      "number",
    ]);
  });

  it("serialises the declared children when mounted", () => {
    const element = append();
    element.innerHTML = "<ev-card-number placeholder='Card'></ev-card-number>";
    element.mountCard(evervault());

    expect(element.spec).toEqual([
      {
        type: "number",
        id: expect.any(String),
        props: { placeholder: "Card" },
        children: undefined,
      },
    ]);
  });

  it("sends the tree again when a child is declared", async () => {
    const element = append();
    element.mountCard(evervault());

    element.append(document.createElement("ev-card-cvc"));
    await flush();

    expect(types(lastSpec())).toEqual(["cvc"]);
    expect(types(element.spec)).toEqual(["cvc"]);
  });

  it("sends the tree again when an attribute changes", async () => {
    const element = append();
    element.innerHTML = "<ev-card-number></ev-card-number>";
    element.mountCard(evervault());

    element.children[0].setAttribute("placeholder", "Card number");
    await flush();

    expect(lastSpec()[0].props).toEqual({ placeholder: "Card number" });
  });

  it("keeps the id of a child across reads", async () => {
    const element = append();
    element.innerHTML = "<ev-card-number></ev-card-number>";
    element.mountCard(evervault());
    const [before] = element.spec;

    element.children[0].setAttribute("placeholder", "Card number");
    await flush();

    expect(lastSpec()[0].id).toBe(before.id);
  });

  it("sends the tree once for children declared in the same tick", async () => {
    const element = append();
    element.mountCard(evervault());
    vi.mocked(serialise).mockClear();

    element.append(document.createElement("ev-card-number"));
    element.append(document.createElement("ev-card-expiry"));
    element.append(document.createElement("ev-card-cvc"));
    await flush();

    expect(serialise).toHaveBeenCalledOnce();
    expect(frame().setSpec).toHaveBeenCalledOnce();
    expect(types(lastSpec())).toEqual(["number", "expiry", "cvc"]);
  });

  it("returns to the default fields when every child is removed", async () => {
    const element = append();
    element.innerHTML = "<ev-card-number></ev-card-number>";
    element.mountCard(evervault());

    element.innerHTML = "";
    await flush();

    expect(types(lastSpec())).toEqual(["number", "row"]);
  });

  it("stops reading its children once removed from the DOM", async () => {
    const element = append();
    element.mountCard(evervault());
    element.remove();
    vi.mocked(serialise).mockClear();

    element.append(document.createElement("ev-card-number"));
    await flush();

    expect(serialise).not.toHaveBeenCalled();
    expect(frame().setSpec).not.toHaveBeenCalled();
    expect(element.spec).toEqual([]);
  });
});

describe("<ev-card> attributes", () => {
  it("mounts with auto-progress on when the attribute is declared", () => {
    const element = append({ "auto-progress": "" });
    element.mountCard(evervault());

    expect(mountedWith().config?.autoProgress).toBe(true);
  });

  it("mounts with auto-progress off when the attribute denies it", () => {
    const element = append({ "auto-progress": "false" });
    element.mountCard(evervault());

    expect(mountedWith().config?.autoProgress).toBe(false);
  });

  it("leaves auto-progress unset when the attribute is absent", () => {
    const element = append();
    element.mountCard(evervault());

    expect(mountedWith().config?.autoProgress).toBeUndefined();
  });

  it("pushes auto-progress to the card when the attribute changes", async () => {
    const element = append();
    element.mountCard(evervault());

    element.setAttribute("auto-progress", "");
    await flush();

    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({ config: { autoProgress: true } })
    );
  });

  it("takes auto-progress back when the attribute is removed", async () => {
    const element = append({ "auto-progress": "" });
    element.mountCard(evervault());

    element.removeAttribute("auto-progress");
    await flush();

    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({ config: { autoProgress: undefined } })
    );
  });

  it("pushes no configuration when only a child changes", async () => {
    const element = append();
    element.mountCard(evervault());

    element.append(document.createElement("ev-card-cvc"));
    await flush();

    expect(frame().update).not.toHaveBeenCalled();
  });

  it("mounts with the theme named by the attribute", () => {
    const element = append({ theme: "material" });
    element.mountCard(evervault());

    expect(mountedWith().theme).toEqual({ styles: { theme: "material" } });
  });

  it("falls back to the clean theme for a name it does not know", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = append({ theme: "brutalist" });
    element.mountCard(evervault());

    expect(mountedWith().theme).toEqual({ styles: { theme: "clean" } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"brutalist"'));

    warn.mockRestore();
  });

  it("pushes the new theme when the attribute changes", async () => {
    const element = append();
    element.mountCard(evervault());

    element.setAttribute("theme", "minimal");
    await flush();

    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({ theme: { styles: { theme: "minimal" } } })
    );
  });

  it("mounts with a theme set as a property", () => {
    const theme = { styles: { theme: "mine" } };
    const element = append({ theme: "material" });
    element.theme = theme;
    element.mountCard(evervault());

    expect(mountedWith().theme).toBe(theme);
    expect(element.theme).toBe(theme);
  });

  it("reads the attribute back through the property when none is set", () => {
    const element = append({ theme: "material" });

    expect(element.theme).toBe("material");
  });

  it("pushes a theme set as a property on a mounted card", () => {
    const theme = { styles: { theme: "mine" } };
    const element = append();
    element.mountCard(evervault());

    element.theme = theme;

    expect(frame().update).toHaveBeenCalledWith({ theme });
  });

  it("takes a theme property set before the element upgraded", () => {
    const theme = { styles: { theme: "mine" } };
    const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;
    Object.defineProperty(element, "theme", {
      value: theme,
      writable: true,
      configurable: true,
    });

    document.body.append(element);
    element.mountCard(evervault());

    expect(Object.prototype.hasOwnProperty.call(element, "theme")).toBe(false);
    expect(mountedWith().theme).toBe(theme);
  });

  it("mounts the frame with the colour scheme from the attribute", () => {
    const element = append({ "color-scheme": "dark" });
    element.mountCard(evervault());

    expect(frame().options).toEqual({ colorScheme: "dark" });
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

    new UIComponents(evervault()).mountElements();

    expect(hosts).toHaveLength(2);
    expect(hosts[0].mount).toHaveBeenCalledOnce();
    expect(hosts[1].mount).toHaveBeenCalledOnce();
  });

  it("leaves a card that is already mounted alone", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    append({ "team-id": "team_test123", "app-id": "app_test123" });

    new UIComponents(evervault()).mountElements();

    expect(hosts).toHaveLength(1);
    expect(error).not.toHaveBeenCalled();
  });
});

describe("<ev-card> teardown", () => {
  const evervault = {
    config: {
      teamId: "team_test123",
      appId: "app_test123",
      components: { url: "https://ui-components.evervault.com" },
    },
  } as unknown as EvervaultClient;

  beforeEach(async () => {
    const actual = await vi.importActual<{ CardHost: typeof CardHost }>(
      "../lib/ui/cardHost"
    );
    real.CardHost = actual.CardHost;
  });

  afterEach(() => {
    delete real.CardHost;
    vi.restoreAllMocks();
  });

  function mount() {
    const element = append();
    element.mountCard(evervault);
    return element;
  }

  it("releases every window listener when removed from the DOM", () => {
    const listeners = countMessageListeners();
    const element = mount();

    expect(listeners()).toBeGreaterThan(0);

    element.remove();

    expect(listeners()).toBe(0);
  });

  it("holds no listeners after repeated moves in the DOM", () => {
    const listeners = countMessageListeners();
    const element = mount();
    const live = listeners();
    const other = document.createElement("div");
    document.body.append(other);

    for (let i = 0; i < 20; i += 1) {
      (i % 2 === 0 ? other : document.body).append(element);
    }

    expect(listeners()).toBe(live);

    element.remove();

    expect(listeners()).toBe(0);
  });
});
