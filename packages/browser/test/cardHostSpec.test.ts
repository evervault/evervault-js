import { afterEach, describe, expect, it, vi } from "vitest";
import { CardHost } from "../lib/ui/cardHost";
import type EvervaultClient from "../lib/main";
import type { CardSpecNode } from "types";
import { frameMessage } from "./helpers/messageListeners";

const client = {
  config: {
    teamId: "team_test123",
    appId: "app_test123",
    components: { url: "https://ui-components.evervault.com" },
  },
} as unknown as EvervaultClient;

function node(type: CardSpecNode["type"], id: string): CardSpecNode {
  return { type, id, props: {} };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// Everything the host posts into the frame, by message type.
function mounted(spec: CardSpecNode[], config = {}) {
  const container = document.createElement("div");
  document.body.append(container);

  const frame = new CardHost(client).mount(container, {
    config: { fields: spec, ...config },
  });

  const iframe = container.querySelector("iframe");
  if (!iframe?.contentWindow) throw new Error("no frame window");
  const posted = vi.spyOn(iframe.contentWindow, "postMessage");

  const sent = (type: string) =>
    posted.mock.calls
      .map(([data]) => data as { type: string; payload: unknown })
      .filter((data) => data.type === type)
      .map((data) => data.payload);

  const handshake = () => frameMessage(container, "EV_FRAME_HANDSHAKE");
  const ready = () => frameMessage(container, "EV_FRAME_READY");

  return { frame, sent, handshake, ready };
}

describe("CardHost spec", () => {
  it("mounts the frame with the declared tree as its fields", () => {
    const spec = [node("number", "a")];
    const { sent, handshake } = mounted(spec);

    handshake();

    expect(sent("EV_INIT")).toEqual([
      { theme: undefined, config: { fields: spec } },
    ]);
  });

  it("sends only the difference when the tree changes", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);
    ready();

    frame.setSpec([node("number", "a"), node("cvc", "b")]);

    expect(sent("EV_SPEC_PATCH")).toEqual([
      {
        ops: [
          { op: "insert", parentId: null, index: 1, node: node("cvc", "b") },
        ],
      },
    ]);
  });

  it("sends nothing when the tree is set to what the frame holds", () => {
    const spec = [node("number", "a")];
    const { frame, sent, ready } = mounted(spec);
    ready();

    frame.setSpec([node("number", "a")]);

    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("holds a changed tree until the frame is ready", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);

    frame.setSpec([node("cvc", "b")]);

    expect(sent("EV_SPEC_PATCH")).toEqual([]);

    ready();

    expect(sent("EV_SPEC_PATCH")).toEqual([
      {
        ops: [
          { op: "insert", parentId: null, index: 1, node: node("cvc", "b") },
          { op: "remove", id: "a" },
        ],
      },
    ]);
  });

  it("sends no patch when the frame becomes ready again", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);
    ready();
    frame.setSpec([node("number", "a")]);

    ready();

    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("patches from the mounted tree when the frame becomes ready again", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);
    ready();
    frame.setSpec([node("number", "a"), node("cvc", "b")]);

    // The frame reloaded from the mount configuration, so it lost the patch.
    ready();

    expect(sent("EV_SPEC_PATCH")).toHaveLength(2);
    expect(sent("EV_SPEC_PATCH")[1]).toEqual(sent("EV_SPEC_PATCH")[0]);
  });

  it("carries the current tree when the configuration is updated", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);
    ready();
    frame.setSpec([node("cvc", "b")]);

    frame.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")).toEqual([
      {
        theme: undefined,
        config: { fields: [node("cvc", "b")], autoProgress: true },
      },
    ]);
  });

  it("keeps the mounted configuration under an update", () => {
    const { frame, sent, ready } = mounted([node("number", "a")], {
      autoFocus: true,
    });
    ready();

    frame.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { autoFocus: true, autoProgress: true },
    });
  });

  it("takes a tree given through an update as the one the frame holds", () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);
    ready();

    frame.update({ config: { fields: [node("cvc", "b")] } });
    frame.setSpec([node("cvc", "b")]);

    expect(sent("EV_UPDATE")).toHaveLength(1);
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("sends a configuration updated before ready once the frame is ready", async () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);

    frame.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")).toEqual([]);

    ready();
    await Promise.resolve();

    expect(sent("EV_UPDATE")).toEqual([
      {
        theme: undefined,
        config: { fields: [node("number", "a")], autoProgress: true },
      },
    ]);
  });

  it("sends no patch for a tree the frame was told about in an update", async () => {
    const { frame, sent, ready } = mounted([node("number", "a")]);

    frame.setSpec([node("cvc", "b")]);
    frame.update({ config: { autoProgress: true } });
    ready();
    await Promise.resolve();

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { fields: [node("cvc", "b")] },
    });
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("does not track a tree for a card described by a field list", () => {
    const { frame, sent, ready } = mounted(["number", "cvc"] as never);
    ready();

    frame.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { fields: ["number", "cvc"] },
    });
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });
});
