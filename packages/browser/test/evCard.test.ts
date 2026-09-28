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
import {
  COMBINED_EXPIRY_WITH_HALF,
  EXPIRY_HALVES_APART,
  loneExpiryHalf,
  unknownTheme,
} from "../lib/ui/elements/developerMessages";
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
    send = vi.fn(() => this);
    validate = vi.fn(() => this);
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

  it("mounts a card from its teamid and appid attributes", () => {
    append({ teamid: "team_test123", appid: "app_test123" });

    expect(createClient).toHaveBeenCalledWith("team_test123", "app_test123");
    expect(frame().mount).toHaveBeenCalledOnce();
  });

  it("does not mount a card when the attributes are missing", () => {
    append({ teamid: "team_test123" });

    expect(createClient).not.toHaveBeenCalled();
    expect(hosts).toHaveLength(0);
  });

  it("does not mount a card when an attribute is empty", () => {
    append({ teamid: "team_test123", appid: "" });

    expect(createClient).not.toHaveBeenCalled();
    expect(hosts).toHaveLength(0);
  });

  it("does not mount a second card", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append({
      teamid: "team_test123",
      appid: "app_test123",
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
      teamid: "team_test123",
      appid: "app_test123",
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

  it("mounts the card with a declared <ev-field> in its tree", () => {
    const element = append();
    element.innerHTML =
      "<ev-card-number></ev-card-number><ev-field name='postcode'></ev-field>";
    element.mountCard(evervault());

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "number",
      "field",
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

// The parser connects <ev-card> at its opening tag, then appends each child.
describe("<ev-card> parsed from markup", () => {
  let readyState: DocumentReadyState;

  beforeEach(() => {
    readyState = "loading";
    vi.spyOn(document, "readyState", "get").mockImplementation(
      () => readyState
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function finishParsing() {
    readyState = "interactive";
    document.dispatchEvent(new Event("DOMContentLoaded"));
  }

  it("waits for the page to finish parsing before mounting", async () => {
    const element = append({ teamid: "team_test123", appid: "app_test123" });
    element.append(document.createElement("ev-card-number"));
    await flush();

    expect(hosts).toHaveLength(0);

    finishParsing();

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "number",
    ]);
    expect(frame().setSpec).not.toHaveBeenCalled();
  });

  it("mounts once the parser reads past its closing tag", async () => {
    const element = append({ teamid: "team_test123", appid: "app_test123" });
    element.append(document.createElement("ev-card-number"));
    document.body.append(document.createElement("p"));
    await flush();

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "number",
    ]);
  });

  it("mounts at once when the parser has already read past it", () => {
    document.body.innerHTML =
      "<ev-card teamid='team_test123' appid='app_test123'></ev-card><p></p>";

    expect(frame().mount).toHaveBeenCalledOnce();
  });

  it("does not mount when removed before the page finishes parsing", () => {
    const element = append({ teamid: "team_test123", appid: "app_test123" });
    element.remove();

    finishParsing();

    expect(hosts).toHaveLength(0);
  });
});

describe("<ev-card> attributes", () => {
  it("mounts with auto-progress on when the attribute is declared", () => {
    const element = append({ autoprogress: "" });
    element.mountCard(evervault());

    expect(mountedWith().config?.autoProgress).toBe(true);
  });

  it("mounts with auto-progress off when the attribute denies it", () => {
    const element = append({ autoprogress: "false" });
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

    element.setAttribute("autoprogress", "");
    await flush();

    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({ config: { autoProgress: true } })
    );
  });

  it("takes auto-progress back when the attribute is removed", async () => {
    const element = append({ autoprogress: "" });
    element.mountCard(evervault());

    element.removeAttribute("autoprogress");
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
    expect(warn).toHaveBeenCalledWith(unknownTheme("brutalist"));

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

  it("pushes a theme set as a property on a mounted card", async () => {
    const theme = { styles: { theme: "mine" } };
    const element = append();
    element.mountCard(evervault());

    element.theme = theme;
    await flush();

    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({ theme })
    );
  });

  it("pushes a theme and an option attribute changed together as one update", async () => {
    const theme = { styles: { theme: "mine" } };
    const element = append();
    element.mountCard(evervault());

    element.theme = theme;
    element.setAttribute("autoprogress", "");
    await flush();

    expect(frame().update).toHaveBeenCalledOnce();
    expect(frame().update).toHaveBeenCalledWith(
      expect.objectContaining({
        theme,
        config: expect.objectContaining({ autoProgress: true }),
      })
    );
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
    const element = append({ colorscheme: "dark" });
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

describe("<ev-card> events", () => {
  it.each([
    ["ready", null],
    ["error", null],
    ["complete", { isComplete: true }],
    ["swipe", { number: "4242" }],
    ["validate", { isValid: false }],
    ["focus", { field: "number" }],
    ["blur", { field: "cvc" }],
    ["keydown", { field: "field", name: "postcode" }],
    ["keyup", { field: "expiry" }],
  ])("dispatches the card's %s event with its payload", (event, payload) => {
    const element = append();
    const listener = vi.fn();
    element.addEventListener(event, listener);

    element.mountCard(evervault());
    frame().handlers[event](payload);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].detail).toEqual(payload);
  });

  it.each([
    ["ready", undefined],
    ["focus", { field: "number" }],
    ["keydown", { field: "number" }],
  ])("keeps the %s event on the element", (event, payload) => {
    const element = append();
    const listener = vi.fn();
    document.body.addEventListener(event, listener);

    element.mountCard(evervault());
    frame().handlers[event](payload);

    expect(listener).not.toHaveBeenCalled();

    document.body.removeEventListener(event, listener);
  });

  it("asks the card to validate its fields", () => {
    const element = append();
    element.mountCard(evervault());

    element.validate();

    expect(frame().validate).toHaveBeenCalledOnce();
  });

  it("does nothing when asked to validate before mounting", () => {
    const element = append();

    expect(() => element.validate()).not.toThrow();
  });
});

describe("<ev-card> settings", () => {
  it("mounts with the settings set as properties", () => {
    const element = append();
    element.acceptedBrands = ["visa"];
    element.translations = { number: { label: "Number" } };
    element.redactCVC = true;

    element.mountCard(evervault());

    expect(mountedWith().config).toMatchObject({
      acceptedBrands: ["visa"],
      translations: { number: { label: "Number" } },
      redactCVC: true,
    });
  });

  it("pushes a setting changed on a mounted card", async () => {
    const element = append();
    element.mountCard(evervault());

    element.icons = true;
    await flush();

    expect(frame().update).toHaveBeenLastCalledWith({
      theme: expect.anything(),
      config: expect.objectContaining({ icons: true }),
    });
  });

  it("keeps the other settings when one changes", async () => {
    const element = append({ autoprogress: "" });
    element.acceptedBrands = ["visa"];
    element.mountCard(evervault());

    element.icons = true;
    await flush();

    expect(frame().update).toHaveBeenLastCalledWith({
      theme: expect.anything(),
      config: expect.objectContaining({
        acceptedBrands: ["visa"],
        icons: true,
        autoProgress: true,
      }),
    });
  });

  it("pushes settings changed together as one update", async () => {
    const element = append();
    element.mountCard(evervault());

    element.icons = true;
    element.redactCVC = true;
    element.acceptedBrands = ["visa"];
    await flush();

    expect(frame().update).toHaveBeenCalledOnce();
    expect(frame().update).toHaveBeenCalledWith({
      theme: expect.anything(),
      config: expect.objectContaining({
        icons: true,
        redactCVC: true,
        acceptedBrands: ["visa"],
      }),
    });
  });

  it("pushes a theme definition with the settings changed alongside it", async () => {
    const element = append();
    const theme = { styles: { theme: "custom" } };
    element.mountCard(evervault());

    element.theme = theme;
    element.translations = { number: { label: "Number" } };
    await flush();

    expect(frame().update).toHaveBeenCalledOnce();
    expect(frame().update).toHaveBeenCalledWith({
      theme,
      config: expect.objectContaining({
        translations: { number: { label: "Number" } },
      }),
    });
  });

  it("pushes nothing for agent tools set on a mounted card", async () => {
    const element = append();
    element.mountCard(evervault());

    element.agentTools = { enabled: true };
    await flush();

    expect(frame().update).not.toHaveBeenCalled();
    expect(element.agentTools).toEqual({ enabled: true });
  });

  it("keeps the agent tools the card mounted with", async () => {
    const element = append();
    element.mountCard({
      config: { appId: "app_test123" },
    } as unknown as EvervaultClient);

    element.agentTools = { enabled: true };
    element.icons = true;
    await flush();

    expect(frame().update).toHaveBeenLastCalledWith({
      theme: expect.anything(),
      config: expect.objectContaining({ agentTools: undefined }),
    });
  });

  it("reads each setting back through its property", () => {
    const element = append();
    const validation = { cvc: { optional: true } };

    element.validation = validation;

    expect(element.validation).toBe(validation);
  });

  it("sends a changed cardholder name to a mounted card", () => {
    const element = append();
    element.mountCard(evervault());

    element.defaultValues = { name: "Jane" };

    expect(frame().send).toHaveBeenCalledWith("EV_UPDATE_NAME", "Jane");
  });

  it("sends the cardholder name again only when it changes", () => {
    const element = append();
    element.mountCard(evervault());
    element.defaultValues = { name: "Jane" };

    element.defaultValues = {
      ...element.defaultValues,
      fields: { postcode: "SW1A" },
    };

    expect(frame().send).toHaveBeenCalledOnce();
  });

  it("delegates the tools permission to a frame with agent tools", () => {
    const element = append();
    element.agentTools = { enabled: true };

    element.mountCard({
      config: { appId: "app_test123" },
    } as unknown as EvervaultClient);

    expect(frame().options).toMatchObject({ allow: "payment; tools" });
  });

  it("takes a setting set before the element upgraded", () => {
    const element = document.createElement(EV_CARD_TAG_NAME) as EvCard;
    Object.defineProperty(element, "acceptedBrands", {
      value: ["visa"],
      writable: true,
      configurable: true,
    });

    document.body.append(element);
    element.mountCard(evervault());

    expect(
      Object.prototype.hasOwnProperty.call(element, "acceptedBrands")
    ).toBe(false);
    expect(mountedWith().config).toMatchObject({ acceptedBrands: ["visa"] });
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
    append({ teamid: "team_test123", appid: "app_test123" });

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

describe("<ev-card> split expiry", () => {
  const SPLIT = `
    <ev-card-number></ev-card-number>
    <ev-card-expiry-month></ev-card-expiry-month>
    <ev-card-expiry-year></ev-card-expiry-year>
  `;

  it("mounts a card declaring both halves", () => {
    const element = append();
    element.innerHTML = SPLIT;
    element.mountCard(evervault());

    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "number",
      "expiryMonth",
      "expiryYear",
    ]);
  });

  it("refuses to mount a card declaring a month without a year", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.innerHTML = "<ev-card-expiry-month></ev-card-expiry-month>";
    element.mountCard(evervault());

    expect(hosts).toHaveLength(0);
    expect(element.isMounted).toBe(false);
    expect(error).toHaveBeenCalledWith(loneExpiryHalf("expiryMonth"));

    error.mockRestore();
  });

  it("mounts a refused card once the missing half is added", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.innerHTML = "<ev-card-expiry-month></ev-card-expiry-month>";
    element.mountCard(evervault());

    element.append(document.createElement("ev-card-expiry-year"));
    await flush();

    expect(hosts).toHaveLength(1);
    expect(element.isMounted).toBe(true);
    expect(types(mountedWith().config?.fields as CardSpecNode[])).toEqual([
      "expiryMonth",
      "expiryYear",
    ]);

    error.mockRestore();
  });

  it("mounts a refused card once with the options set before it was whole", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.innerHTML = "<ev-card-expiry-year></ev-card-expiry-year>";
    element.mountCard(evervault());

    element.setAttribute("autoprogress", "");
    element.prepend(document.createElement("ev-card-expiry-month"));
    await flush();

    expect(hosts).toHaveLength(1);
    expect(mountedWith().config?.autoProgress).toBe(true);
    expect(frame().update).not.toHaveBeenCalled();

    error.mockRestore();
  });

  it("refuses to mount a card mixing the combined expiry and a half", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.innerHTML = `
      <ev-card-expiry></ev-card-expiry>
      <ev-card-expiry-year></ev-card-expiry-year>
    `;
    element.mountCard(evervault());

    expect(hosts).toHaveLength(0);
    expect(error).toHaveBeenCalledWith(COMBINED_EXPIRY_WITH_HALF);

    error.mockRestore();
  });

  it("keeps the last tree when a change leaves a lone half", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.innerHTML = SPLIT;
    element.mountCard(evervault());
    const before = element.spec;

    element.querySelector("ev-card-expiry-year")?.remove();
    await flush();

    expect(frame().setSpec).not.toHaveBeenCalled();
    expect(element.spec).toBe(before);
    expect(error).toHaveBeenCalledWith(loneExpiryHalf("expiryMonth"));

    error.mockRestore();
  });

  it("sends the halves once the second arrives", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = append();
    element.mountCard(evervault());

    element.append(document.createElement("ev-card-expiry-month"));
    await flush();

    expect(frame().setSpec).not.toHaveBeenCalled();

    element.append(document.createElement("ev-card-expiry-year"));
    await flush();

    expect(types(lastSpec())).toEqual(["expiryMonth", "expiryYear"]);

    error.mockRestore();
  });

  it("warns once about fields between the halves", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = append();
    element.innerHTML = `
      <ev-card-expiry-month></ev-card-expiry-month>
      <ev-card-cvc></ev-card-cvc>
      <ev-card-expiry-year></ev-card-expiry-year>
    `;
    element.mountCard(evervault());

    expect(warn).toHaveBeenCalledWith(EXPIRY_HALVES_APART);

    element.children[0].setAttribute("label", "Month");
    await flush();

    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
  });

  it("warns again once the halves are parted a second time", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = append();
    element.innerHTML = SPLIT;
    element.mountCard(evervault());

    expect(warn).not.toHaveBeenCalled();

    const cvc = document.createElement("ev-card-cvc");
    element.insertBefore(cvc, element.children[2]);
    await flush();

    expect(warn).toHaveBeenCalledOnce();

    cvc.remove();
    await flush();
    element.insertBefore(cvc, element.children[2]);
    await flush();

    expect(warn).toHaveBeenCalledTimes(2);

    warn.mockRestore();
  });
});
