import { describe, expect, it } from "vitest";
import { declaredProps, fieldProps } from "../src/Card/props";
import type { CardSpecNode } from "types";

function node(
  type: CardSpecNode["type"],
  props: Record<string, string>
): CardSpecNode {
  return { type, id: "a", props };
}

describe("fieldProps", () => {
  it("maps the attributes every field understands", () => {
    expect(
      fieldProps(
        node("cvc", {
          label: "CVC",
          placeholder: "123",
          tooltip: "3 digits on the back",
        })
      )
    ).toEqual({
      label: "CVC",
      placeholder: "123",
      tooltip: "3 digits on the back",
    });
  });

  it("maps a hyphenated attribute onto its prop", () => {
    expect(
      fieldProps(node("number", { "icon-position": "inline-start" }))
    ).toEqual({ iconPosition: "inline-start" });
  });

  it("only maps an attribute onto the field that understands it", () => {
    expect(
      fieldProps(node("cvc", { "icon-position": "inline-start" }))
    ).toEqual({});
  });

  it("ignores attributes no field understands", () => {
    expect(fieldProps(node("number", { class: "mine", id: "number" }))).toEqual(
      {}
    );
  });

  it("has no props when nothing was declared", () => {
    expect(fieldProps(node("number", {}))).toEqual({});
  });

  it("reads a bare boolean attribute as true", () => {
    expect(fieldProps(node("cvc", { redact: "", optional: "" }))).toEqual({
      redact: true,
      optional: true,
    });
  });

  it("reads a boolean attribute set to false as false", () => {
    expect(
      fieldProps(node("cvc", { redact: "false", autofocus: "FALSE" }))
    ).toEqual({ redact: false, autoFocus: false });
  });

  it("reads any other boolean attribute value as true", () => {
    expect(fieldProps(node("cvc", { redact: "true" }))).toEqual({
      redact: true,
    });
    expect(fieldProps(node("cvc", { redact: "0" }))).toEqual({ redact: true });
    expect(fieldProps(node("cvc", { redact: "no" }))).toEqual({ redact: true });
  });

  it("reads off as true outside autocomplete, which alone spells it that way", () => {
    expect(fieldProps(node("cvc", { redact: "off" }))).toEqual({
      redact: true,
    });
    expect(fieldProps(node("cvc", { autocomplete: "off" }))).toEqual({
      autoComplete: false,
    });
  });

  it("reads autocomplete off as false", () => {
    expect(fieldProps(node("number", { autocomplete: "off" }))).toEqual({
      autoComplete: false,
    });
  });

  it("reads autocomplete on as true", () => {
    expect(fieldProps(node("number", { autocomplete: "on" }))).toEqual({
      autoComplete: true,
    });
  });

  it("only maps redact and optional onto the security code", () => {
    expect(fieldProps(node("number", { redact: "", optional: "" }))).toEqual(
      {}
    );
  });

  it("only maps the default value onto the card holder", () => {
    expect(fieldProps(node("cvc", { "default-value": "Jane Doe" }))).toEqual(
      {}
    );
    expect(fieldProps(node("name", { "default-value": "Jane Doe" }))).toEqual({
      defaultValue: "Jane Doe",
    });
  });
});

describe("declaredProps", () => {
  it("keeps the props of each field in the declared order", () => {
    const declared = declaredProps([
      { type: "cvc", id: "a", props: { redact: "" } },
      { type: "number", id: "b", props: { label: "Number" } },
    ]);

    expect([...declared.keys()]).toEqual(["cvc", "number"]);
    expect(declared.get("cvc")).toEqual({ redact: true });
    expect(declared.get("number")).toEqual({ label: "Number" });
  });

  it("keeps the props of the first node declaring a field", () => {
    const declared = declaredProps([
      { type: "cvc", id: "a", props: { label: "First" } },
      { type: "cvc", id: "b", props: { label: "Second" } },
    ]);

    expect(declared.get("cvc")).toEqual({ label: "First" });
  });

  it("reads the fields declared inside a row", () => {
    const declared = declaredProps([
      {
        type: "row",
        id: "row",
        props: {},
        children: [
          { type: "expiry", id: "a", props: {} },
          { type: "cvc", id: "b", props: { optional: "" } },
        ],
      },
    ]);

    expect([...declared.keys()]).toEqual(["expiry", "cvc"]);
    expect(declared.get("cvc")).toEqual({ optional: true });
  });
});
