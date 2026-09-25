import { afterEach, describe, expect, it, vi } from "vitest";
import { CardHost } from "../lib/ui/cardHost";
import type { CardSpecNode } from "types";
import { frameMessage } from "./helpers/messageListeners";
import { client } from "./helpers/client";

function node(type: CardSpecNode["type"], id: string): CardSpecNode {
  return { type, id, props: {} };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// Everything the host posts into the cardHost, by message type.
function mounted(spec: CardSpecNode[], config = {}) {
  const container = document.createElement("div");
  document.body.append(container);

  const cardHost = new CardHost(client).mount(container, {
    config: { fields: spec, ...config },
  });

  const iframe = container.querySelector("iframe");
  if (!iframe?.contentWindow) throw new Error("no cardHost window");
  const posted = vi.spyOn(iframe.contentWindow, "postMessage");

  const sent = (type: string) =>
    posted.mock.calls
      .map(([data]) => data as { type: string; payload: unknown })
      .filter((data) => data.type === type)
      .map((data) => data.payload);

  const handshake = () => frameMessage(container, "EV_FRAME_HANDSHAKE");
  const ready = () => frameMessage(container, "EV_FRAME_READY");

  return { cardHost, sent, handshake, ready };
}

describe("CardHost spec", () => {
  it("mounts the cardHost with the declared tree as its fields", () => {
    const spec = [node("number", "a")];
    const { sent, handshake } = mounted(spec);

    handshake();

    expect(sent("EV_INIT")).toEqual([
      { theme: undefined, config: { fields: spec } },
    ]);
  });

  it("sends only the difference when the tree changes", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);
    ready();

    cardHost.setSpec([node("number", "a"), node("cvc", "b")]);

    expect(sent("EV_SPEC_PATCH")).toEqual([
      {
        ops: [
          { op: "insert", parentId: null, index: 1, node: node("cvc", "b") },
        ],
      },
    ]);
  });

  it("sends nothing when the tree is set to what the cardHost holds", () => {
    const spec = [node("number", "a")];
    const { cardHost, sent, ready } = mounted(spec);
    ready();

    cardHost.setSpec([node("number", "a")]);

    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("holds a changed tree until the cardHost is ready", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);

    cardHost.setSpec([node("cvc", "b")]);

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

  it("sends no patch when the cardHost becomes ready again", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);
    ready();
    cardHost.setSpec([node("number", "a")]);

    ready();

    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("patches from the mounted tree when the cardHost becomes ready again", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);
    ready();
    cardHost.setSpec([node("number", "a"), node("cvc", "b")]);

    // The cardHost reloaded from the mount configuration, so it lost the patch.
    ready();

    expect(sent("EV_SPEC_PATCH")).toHaveLength(2);
    expect(sent("EV_SPEC_PATCH")[1]).toEqual(sent("EV_SPEC_PATCH")[0]);
  });

  it("carries the current tree when the configuration is updated", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);
    ready();
    cardHost.setSpec([node("cvc", "b")]);

    cardHost.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")).toEqual([
      {
        theme: undefined,
        config: { fields: [node("cvc", "b")], autoProgress: true },
      },
    ]);
  });

  it("keeps the mounted configuration under an update", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")], {
      autoFocus: true,
    });
    ready();

    cardHost.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { autoFocus: true, autoProgress: true },
    });
  });

  it("takes a tree given through an update as the one the cardHost holds", () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);
    ready();

    cardHost.update({ config: { fields: [node("cvc", "b")] } });
    cardHost.setSpec([node("cvc", "b")]);

    expect(sent("EV_UPDATE")).toHaveLength(1);
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("sends a configuration updated before ready once the cardHost is ready", async () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);

    cardHost.update({ config: { autoProgress: true } });

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

  it("sends no patch for a tree the cardHost was told about in an update", async () => {
    const { cardHost, sent, ready } = mounted([node("number", "a")]);

    cardHost.setSpec([node("cvc", "b")]);
    cardHost.update({ config: { autoProgress: true } });
    ready();
    await Promise.resolve();

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { fields: [node("cvc", "b")] },
    });
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });

  it("does not track a tree for a card described by a field list", () => {
    const { cardHost, sent, ready } = mounted(["number", "cvc"] as never);
    ready();

    cardHost.update({ config: { autoProgress: true } });

    expect(sent("EV_UPDATE")[0]).toMatchObject({
      config: { fields: ["number", "cvc"] },
    });
    expect(sent("EV_SPEC_PATCH")).toEqual([]);
  });
});
