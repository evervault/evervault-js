import { describe, it, expect } from "vitest";
import { validateNumber, validateCVC } from "../index";
import type { CustomBrand } from "../types";

const acmeBrand: CustomBrand = {
  name: "acme-card",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: true,
    ranges: [[88000, 88999]],
    lengths: [16],
  },
  securityCodeValidationRules: {
    lengths: [4],
  },
};

const noLuhnBrand: CustomBrand = {
  name: "no-luhn-brand",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: false,
    ranges: [9900],
    lengths: [16],
  },
  securityCodeValidationRules: {
    lengths: [3],
  },
};

const anotherBrand: CustomBrand = {
  name: "another-brand",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: false,
    ranges: [7700],
    lengths: [16],
  },
  securityCodeValidationRules: {
    lengths: [3],
  },
};

// Overlaps with visa (4111111111111111) to test default + custom brand coexistence
const customVisaOverlap: CustomBrand = {
  name: "custom-visa-overlap",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: true,
    ranges: [[411100, 411199]],
    lengths: [16],
  },
  securityCodeValidationRules: { lengths: [4] },
};

describe("validateNumber with custom brands", () => {
  it("surfaces a matched custom brand in localBrands, never in brand", () => {
    const result = validateNumber("8810000000000003", {
      customBrands: [acmeBrand],
    });
    expect(result.localBrands).toContain("acme-card");
    expect(result.brand).toBeNull();
  });

  it("does not match a custom brand when customBrands is not passed", () => {
    const result = validateNumber("8810000000000003");
    expect(result.brand).toBeNull();
    expect(result.localBrands).toEqual([]);
    expect(result.isValid).toBe(false);
  });

  it("returns isValid true for a number with correct length and passing luhn", () => {
    // 8810000000000003 is 16 digits and passes luhn
    const result = validateNumber("8810000000000003", {
      customBrands: [acmeBrand],
    });
    expect(result.isValid).toBe(true);
  });

  it("returns isValid false for a number with wrong length", () => {
    const result = validateNumber("88100000000003", {
      customBrands: [acmeBrand],
    });
    expect(result.localBrands).toContain("acme-card");
    expect(result.isValid).toBe(false);
  });

  it("returns isValid false for a number that fails luhn", () => {
    // 8810000000000001 is in range and 16 digits but fails luhn
    const result = validateNumber("8810000000000001", {
      customBrands: [acmeBrand],
    });
    expect(result.localBrands).toContain("acme-card");
    expect(result.isValid).toBe(false);
  });

  it("skips luhn check when luhnCheck is false", () => {
    // 9900000000000000 does not pass luhn but luhnCheck is false for noLuhnBrand
    const result = validateNumber("9900000000000000", {
      customBrands: [noLuhnBrand],
    });
    expect(result.localBrands).toContain("no-luhn-brand");
    expect(result.isValid).toBe(true);
  });

  it("surfaces default brand in brand and custom brand in localBrands when both match", () => {
    const result = validateNumber("4111111111111111", {
      customBrands: [customVisaOverlap],
    });
    expect(result.brand).toBe("visa");
    expect(result.localBrands).toContain("custom-visa-overlap");
  });

  it("each of multiple custom brands matches independently", () => {
    const result = validateNumber("7700000000000000", {
      customBrands: [acmeBrand, anotherBrand],
    });
    expect(result.localBrands).toContain("another-brand");
    expect(result.localBrands).not.toContain("acme-card");
  });

  it("returns null brand, empty localBrands and isValid false when no brand matches", () => {
    const result = validateNumber("0000000000000000", {
      customBrands: [acmeBrand],
    });
    expect(result.brand).toBeNull();
    expect(result.localBrands).toEqual([]);
    expect(result.isValid).toBe(false);
  });
});

describe("validateCVC with custom brands", () => {
  it("accepts a CVC matching the custom brand's required length", () => {
    const result = validateCVC("1234", "8810000000000003", {
      customBrands: [acmeBrand],
    });
    expect(result.isValid).toBe(true);
    expect(result.cvc).toBe("1234");
  });

  it("rejects a CVC not matching the custom brand's required length", () => {
    const result = validateCVC("123", "8810000000000003", {
      customBrands: [acmeBrand],
    });
    expect(result.isValid).toBe(false);
    expect(result.cvc).toBeNull();
  });

  it("accepts a CVC that satisfies either the default or custom brand's rules when both match", () => {
    // visa requires 3 digits, customVisaOverlap requires 4 — both match the card number
    const result = validateCVC("123", "4111111111111111", {
      customBrands: [customVisaOverlap],
    });
    expect(result.isValid).toBe(true);
  });
});
