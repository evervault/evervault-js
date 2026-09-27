import { describe, expect, it } from "vitest";
import {
  COMBINED_EXPIRY_WITH_HALF,
  loneExpiryHalf,
} from "../src/Card/developerMessages";
import { declaredExpiry, joinExpiry, splitExpiry } from "../src/Card/expiry";
import { node, row } from "./helpers/card";

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

  it("throws for a month without a year", () => {
    expect(() => declaredExpiry([node("expiryMonth")])).toThrow(
      loneExpiryHalf("expiryMonth")
    );
  });

  it("throws for a year without a month", () => {
    expect(() => declaredExpiry([row("row", [node("expiryYear")])])).toThrow(
      loneExpiryHalf("expiryYear")
    );
  });

  it("throws for the combined field alongside a half", () => {
    expect(() =>
      declaredExpiry([node("expiry"), node("expiryMonth"), node("expiryYear")])
    ).toThrow(COMBINED_EXPIRY_WITH_HALF);
  });
});

describe("joinExpiry", () => {
  it("joins a complete month and the year", () => {
    expect(joinExpiry({ month: "12", year: "35" })).toBe("1235");
  });

  it("holds back the year until the month is complete", () => {
    expect(joinExpiry({ month: "1", year: "35" })).toBe("1");
    expect(joinExpiry({ month: "", year: "35" })).toBe("");
  });
});

describe("splitExpiry", () => {
  it("splits a joined expiry back into its halves", () => {
    expect(splitExpiry("1235")).toEqual({ month: "12", year: "35" });
    expect(splitExpiry("12")).toEqual({ month: "12", year: "" });
    expect(splitExpiry("")).toEqual({ month: "", year: "" });
  });
});
