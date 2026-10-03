import { describe, expect, it } from "vitest";
import {
  COMBINED_EXPIRY_WITH_HALF,
  loneExpiryHalf,
} from "../src/Card/developerMessages";
import {
  declaredExpiry,
  expiryError,
  joinExpiry,
  splitExpiry,
} from "../src/Card/expiry";
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
});

describe("expiryError", () => {
  it("accepts a tree without an expiry, the combined field, or both halves", () => {
    expect(expiryError([node("number"), node("cvc")])).toBeNull();
    expect(expiryError([node("expiry")])).toBeNull();
    expect(
      expiryError([node("expiryMonth"), node("cvc"), node("expiryYear")])
    ).toBeNull();
  });

  it("refuses a month without a year", () => {
    expect(expiryError([node("expiryMonth")])).toBe(
      loneExpiryHalf("expiryMonth")
    );
  });

  it("refuses a year without a month", () => {
    expect(expiryError([row("row", [node("expiryYear")])])).toBe(
      loneExpiryHalf("expiryYear")
    );
  });

  it("refuses the combined field alongside a half", () => {
    expect(
      expiryError([node("expiry"), node("expiryMonth"), node("expiryYear")])
    ).toBe(COMBINED_EXPIRY_WITH_HALF);
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
