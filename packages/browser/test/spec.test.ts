import { describe, expect, it, vi } from "vitest";
import { ELEMENTS, serialise, warnUnknownChild } from "../lib/ui/elements/spec";

describe("warnUnknownChild", () => {
  it("warns naming the element and returns null", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const element = document.createElement("ev-card-pin");

    expect(warnUnknownChild(element)).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("<ev-card-pin>"));

    warn.mockRestore();
  });

  it("lists the supported children in the warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    warnUnknownChild(document.createElement("div"));

    const [message] = warn.mock.calls[0];
    for (const tag of Object.keys(ELEMENTS)) {
      expect(message).toContain(`<${tag}>`);
    }

    warn.mockRestore();
  });
});

describe("serialise", () => {
  function card(html: string) {
    const element = document.createElement("ev-card");
    element.innerHTML = html;
    return element;
  }

  it("serialises a declared field into a spec node", () => {
    const [node] = serialise(card(`<ev-card-number></ev-card-number>`));

    expect(node).toEqual({
      type: "number",
      id: expect.any(String),
      props: {},
      children: undefined,
    });
  });

  it("serialises a card holder field", () => {
    const [node] = serialise(card(`<ev-card-holder></ev-card-holder>`));

    expect(node.type).toBe("name");
  });

  it("keeps the declared order of the children", () => {
    const spec = serialise(
      card(`
        <ev-card-number></ev-card-number>
        <ev-card-expiry></ev-card-expiry>
        <ev-card-cvc></ev-card-cvc>
      `)
    );

    expect(spec.map((node) => node.type)).toEqual(["number", "expiry", "cvc"]);
  });

  it("reads the attributes of an element into its props", () => {
    const [node] = serialise(
      card(
        `<ev-card-number placeholder="Card number" autofocus=""></ev-card-number>`
      )
    );

    expect(node.props).toEqual({
      placeholder: "Card number",
      autofocus: "",
    });
  });

  it("serialises the children of a row", () => {
    const [row] = serialise(
      card(`
        <ev-row>
          <ev-card-expiry-month></ev-card-expiry-month>
          <ev-card-expiry-year></ev-card-expiry-year>
        </ev-row>
      `)
    );

    expect(row.type).toBe("row");
    expect(row.children?.map((node) => node.type)).toEqual([
      "expiryMonth",
      "expiryYear",
    ]);
  });

  it("gives a field no children", () => {
    const [node] = serialise(
      card(`<ev-card-cvc><ev-card-number></ev-card-number></ev-card-cvc>`)
    );

    expect(node.children).toBeUndefined();
  });

  it("drops unknown children with a warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spec = serialise(
      card(`<div></div><ev-card-number></ev-card-number>`)
    );

    expect(spec.map((node) => node.type)).toEqual(["number"]);
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
  });

  it("gives an element the same id across re-reads", () => {
    const element = card(`<ev-card-number></ev-card-number>`);

    expect(serialise(element)[0].id).toBe(serialise(element)[0].id);
  });

  it("gives each element its own id", () => {
    const spec = serialise(
      card(`<ev-card-number></ev-card-number><ev-card-cvc></ev-card-cvc>`)
    );

    expect(spec[0].id).not.toBe(spec[1].id);
  });

  it("serialises a customer field", () => {
    const [node] = serialise(card(`<ev-field name="postcode"></ev-field>`));

    expect(node.type).toBe("field");
    expect(node.props).toEqual({ name: "postcode" });
  });
});
