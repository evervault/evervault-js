import { describe, expect, it } from "vitest";
import {
  COMBINED_EXPIRY_WITH_HALF,
  EXPIRY_HALVES_APART,
  loneExpiryHalf,
} from "../lib/ui/elements/developerMessages";
import { expiryError, expiryWarning } from "../lib/ui/elements/expiry";
import type { CardSpecNode } from "types";

function node(type: CardSpecNode["type"]): CardSpecNode {
  return { type, id: type, props: {} };
}

function row(children: CardSpecNode[]): CardSpecNode {
  return { type: "row", id: "row", props: {}, children };
}

describe("expiryError", () => {
  it("accepts a tree without an expiry", () => {
    expect(expiryError([node("number"), node("cvc")])).toBeNull();
  });

  it("accepts the combined field", () => {
    expect(expiryError([node("number"), node("expiry")])).toBeNull();
  });

  it("accepts both halves, wherever they sit", () => {
    expect(
      expiryError([row([node("expiryMonth")]), node("cvc"), node("expiryYear")])
    ).toBeNull();
  });

  it("names the missing year", () => {
    expect(expiryError([node("expiryMonth")])).toBe(
      loneExpiryHalf("expiryMonth")
    );
  });

  it("names the missing month", () => {
    expect(expiryError([row([node("expiryYear")])])).toBe(
      loneExpiryHalf("expiryYear")
    );
  });

  it("refuses the combined field alongside a half", () => {
    expect(expiryError([node("expiry"), node("expiryMonth")])).toBe(
      COMBINED_EXPIRY_WITH_HALF
    );
  });
});

describe("expiryWarning", () => {
  it("says nothing about halves declared next to each other", () => {
    expect(
      expiryWarning([node("number"), node("expiryMonth"), node("expiryYear")])
    ).toBeNull();
  });

  it("says nothing about halves in neighbouring rows", () => {
    expect(
      expiryWarning([row([node("expiryYear")]), row([node("expiryMonth")])])
    ).toBeNull();
  });

  it("says nothing about the combined field", () => {
    expect(expiryWarning([node("expiry"), node("cvc")])).toBeNull();
  });

  it("warns about a field between the halves", () => {
    expect(
      expiryWarning([node("expiryMonth"), node("cvc"), node("expiryYear")])
    ).toBe(EXPIRY_HALVES_APART);
  });

  it("warns about a field between the halves across rows", () => {
    expect(
      expiryWarning([
        row([node("expiryYear"), node("number")]),
        row([node("expiryMonth")]),
      ])
    ).not.toBeNull();
  });
});
