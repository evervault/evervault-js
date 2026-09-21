import type { EvervaultConstructor } from "../src/index";
import { beforeEach, describe, expect, it, vi } from "vitest";

const DEFAULT_URL = "https://js.evervault.test/v2";
const CUSTOM_URL = "https://payments.acme.test/v2";
const OTHER_URL = "https://payments.other.test/v2";

interface Construction {
  bundle: string;
  team: string;
  app: string;
  config: unknown;
}

let constructions: Construction[] = [];

function bundleClient(bundle: string): EvervaultConstructor {
  return class {
    constructor(team: string, app: string, config?: unknown) {
      constructions.push({ bundle, team, app, config });
    }
  } as unknown as EvervaultConstructor;
}

function injectedUrls(): string[] {
  return Array.from(document.head.querySelectorAll("script")).map((s) => s.src);
}

function scriptFor(src: string): HTMLScriptElement {
  const script = Array.from(document.head.querySelectorAll("script")).findLast(
    (s) => s.src === src
  );
  if (!script) throw new Error(`no script was injected for ${src}`);
  return script;
}

function completeLoad(src: string, bundle: string) {
  window.Evervault = bundleClient(bundle);
  scriptFor(src).dispatchEvent(new Event("load"));
}

function failLoad(src: string) {
  scriptFor(src).dispatchEvent(new Event("error"));
}

function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function importSdk() {
  return import("../src/index");
}

beforeEach(() => {
  vi.resetModules();
  document.head.innerHTML = "";
  window.Evervault = undefined;
  constructions = [];
});

describe("preloading", () => {
  it("injects the default bundle without being asked to", async () => {
    await importSdk();
    await flush();

    expect(injectedUrls()).toEqual([DEFAULT_URL]);
  });

  it("preloads the default bundle anyway when loadEvervault is called after the tick with a custom url", async () => {
    const { loadEvervault } = await importSdk();
    await flush();
    completeLoad(DEFAULT_URL, "default");

    const pending = loadEvervault("team_1", "app_1", {
      jsSdkUrl: CUSTOM_URL,
    });
    completeLoad(CUSTOM_URL, "custom");
    await pending;

    expect(injectedUrls()).toEqual([DEFAULT_URL, CUSTOM_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["custom"]);
  });

  it("loads the custom bundle even when the consumer already defined a client", async () => {
    window.Evervault = bundleClient("consumer");
    const { loadEvervault } = await importSdk();
    await flush();

    const pending = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await pending;

    expect(injectedUrls()).toEqual([CUSTOM_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["custom"]);
  });

  it("does not inject anything when the consumer injected the bundle themselves", async () => {
    window.Evervault = bundleClient("consumer");
    const { loadEvervault } = await importSdk();
    await flush();

    await loadEvervault("team_1", "app_1");

    expect(injectedUrls()).toEqual([]);
    expect(constructions.map((c) => c.bundle)).toEqual(["consumer"]);
  });
});

describe("loadEvervault", () => {
  it("constructs the client from the preloaded default bundle", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const pending = loadEvervault("team_1", "app_1");
    completeLoad(DEFAULT_URL, "default");
    await pending;

    expect(injectedUrls()).toEqual([DEFAULT_URL]);
    expect(constructions).toEqual([
      { bundle: "default", team: "team_1", app: "app_1", config: undefined },
    ]);
  });

  it("forwards the whole config, including jsSdkUrl, to the client", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const config = { jsSdkUrl: CUSTOM_URL, isDebugMode: true };
    const pending = loadEvervault("team_1", "app_1", config);
    completeLoad(CUSTOM_URL, "custom");
    await pending;

    expect(constructions[0].config).toEqual(config);
  });

  it("injects a url once, no matter how many callers ask for it", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const first = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    const second = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await Promise.all([first, second]);

    const third = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    await third;

    expect(injectedUrls()).toEqual([DEFAULT_URL, CUSTOM_URL]);
    expect(constructions).toHaveLength(3);
  });

  it("rejects when the bundle fails to load, and retries on the next call", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const failing = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    failLoad(CUSTOM_URL);
    await expect(failing).rejects.toThrow("Failed to load Evervault.js");

    const retried = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await retried;

    expect(injectedUrls()).toEqual([DEFAULT_URL, CUSTOM_URL]);
  });

  it("uses a client the page defined while the preload was still in flight", async () => {
    const tag = document.createElement("script");
    tag.src = OTHER_URL;
    document.head.appendChild(tag);

    const { loadEvervault } = await importSdk();
    await flush();

    completeLoad(OTHER_URL, "page");
    await loadEvervault("team_1", "app_1");

    expect(constructions.map((c) => c.bundle)).toEqual(["page"]);
  });

  it("keeps returning the custom bundle after a slow preload resolves", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const custom = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await custom;

    completeLoad(DEFAULT_URL, "default");

    const again = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    await again;

    expect(injectedUrls()).toEqual([DEFAULT_URL, CUSTOM_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["custom", "custom"]);
  });

  it("rejects when the bundle loads without defining a client", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const pending = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    scriptFor(CUSTOM_URL).dispatchEvent(new Event("load"));

    await expect(pending).rejects.toThrow("Failed to load Evervault.js");
  });

  it("injects a second custom bundle over the first, overwriting the client", async () => {
    const { loadEvervault } = await importSdk();
    await flush();

    const first = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await first;

    const second = loadEvervault("team_1", "app_1", { jsSdkUrl: OTHER_URL });
    completeLoad(OTHER_URL, "other");
    await second;

    expect(injectedUrls()).toEqual([DEFAULT_URL, CUSTOM_URL, OTHER_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["custom", "other"]);
  });
});

describe("script tag consumers", () => {
  function pageTag(src: string) {
    const tag = document.createElement("script");
    tag.src = src;
    document.head.appendChild(tag);
    return tag;
  }

  it("never fetches the default bundle when the page tag ran first", async () => {
    pageTag(OTHER_URL);
    window.Evervault = bundleClient("page");

    const { loadEvervault } = await importSdk();
    await flush();
    await loadEvervault("team_1", "app_1");

    expect(injectedUrls()).toEqual([OTHER_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["page"]);
  });

  it("prefers a page tag that lands after the preload was issued", async () => {
    const tag = pageTag(OTHER_URL);

    const { loadEvervault } = await importSdk();
    await flush();
    expect(injectedUrls()).toEqual([OTHER_URL, DEFAULT_URL]);

    window.Evervault = bundleClient("page");
    tag.dispatchEvent(new Event("load"));
    await loadEvervault("team_1", "app_1");

    expect(constructions.map((c) => c.bundle)).toEqual(["page"]);
  });

  it("still loads a custom url when the page tag already defined a client", async () => {
    pageTag(OTHER_URL);
    window.Evervault = bundleClient("page");

    const { loadEvervault } = await importSdk();
    await flush();

    const pending = loadEvervault("team_1", "app_1", { jsSdkUrl: CUSTOM_URL });
    completeLoad(CUSTOM_URL, "custom");
    await pending;

    expect(injectedUrls()).toEqual([OTHER_URL, CUSTOM_URL]);
    expect(constructions.map((c) => c.bundle)).toEqual(["custom"]);
  });
});
