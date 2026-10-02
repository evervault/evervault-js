import { describe, expect, it } from "vitest";
import { declaredExpiry } from "../src/expiry";
import { node, row } from "./helpers";

describe("declaredExpiry", () => {
  it("finds no expiry in a tree declaring none", () => {
    expect(declaredExpiry([node("number"), node("cvc")])).toBeNull();
  });

  it("finds the combined field", () => {
    expect(declaredExpiry([node("number"), node("expiry")])).toEqual({
      form: "combined",
    });
  });

  it("finds the split halves and the one declared later", () => {
    expect(
      declaredExpiry([node("expiryMonth"), node("cvc"), node("expiryYear")])
    ).toEqual({ form: "split", later: "expiryYear" });
  });

  it("takes the month as the later half when it follows the year", () => {
    expect(declaredExpiry([node("expiryYear"), node("expiryMonth")])).toEqual({
      form: "split",
      later: "expiryMonth",
    });
  });

  it("looks inside rows", () => {
    expect(
      declaredExpiry([
        row("row", [node("expiryMonth")]),
        row("row", [node("expiryYear")]),
      ])
    ).toEqual({ form: "split", later: "expiryYear" });
  });
});
