import { describe, it, expect } from "vitest";
import { getCVCMask } from "../src/Card/CardCVC";
import type { CustomBrand } from "types";

const acmeBrand: CustomBrand = {
  name: "acme-card",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: true,
    ranges: [[88000, 88999]],
    lengths: [16],
  },
  securityCodeValidationRules: { lengths: [3, 4] },
};

describe("getCVCMask", () => {
  it("returns 4-digit mask when cardNumber is empty", () => {
    expect(getCVCMask("")).toBe("0000");
  });

  it("returns 4-digit mask for american-express", () => {
    expect(getCVCMask("378282246310005")).toBe("0000");
  });

  it("returns 3-digit mask for a standard card (visa)", () => {
    expect(getCVCMask("4111111111111111")).toBe("000");
  });

  it("returns mask matching the custom brand max CVC length (4 digits)", () => {
    expect(getCVCMask("8810000000000003", [acmeBrand])).toBe("0000");
  });

  it("falls back to 3-digit mask when no custom brand matches the card number", () => {
    expect(getCVCMask("4111111111111111", [acmeBrand])).toBe("000");
  });
});
