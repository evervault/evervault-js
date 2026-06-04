import { describe, it, expect } from "vitest";
import { cardMaskFromLength, getDynamicMask } from "../src/Card/CardNumber";
import type { CustomBrand } from "types";

// Uses a 17-digit length so the custom mask is distinct from any BASE_MASK entry.
const acmeBrand: CustomBrand = {
  name: "acme-card",
  isLocal: true,
  numberValidationRules: {
    luhnCheck: false,
    ranges: [[8800, 8899]],
    lengths: [17],
  },
  securityCodeValidationRules: { lengths: [4] },
};

describe("cardMaskFromLength", () => {
  it("produces a space-separated groups-of-4 mask for 16 digits", () => {
    expect(cardMaskFromLength(16)).toBe("0000 0000 0000 0000");
  });

  it("handles lengths that are not a multiple of 4", () => {
    expect(cardMaskFromLength(7)).toBe("0000 000");
  });

  it("handles a 19-digit card (unionpay)", () => {
    expect(cardMaskFromLength(19)).toBe("0000 0000 0000 0000 000");
  });

  it("handles a short single-group length", () => {
    expect(cardMaskFromLength(4)).toBe("0000");
  });
});

describe("getDynamicMask", () => {
  const base16 = { mask: "0000 0000 0000 0000", cardLength: 16 };
  const amex = {
    mask: "0000 000000 00000",
    brand: "american-express",
    cardLength: 15,
  };
  const unionpay = {
    mask: "0000 0000 0000 0000 000",
    brand: "unionpay",
    cardLength: 19,
  };
  const compiledMasks = [base16, amex, unionpay];

  it("returns the default 16-digit mask when no brand is matched", () => {
    const result = getDynamicMask(compiledMasks, "0000");
    expect(result).toBe(base16);
  });

  it("returns the amex mask for an american-express number", () => {
    const result = getDynamicMask(compiledMasks, "3782");
    expect(result).toBe(amex);
  });

  it("returns the unionpay mask for a unionpay number", () => {
    const result = getDynamicMask(compiledMasks, "6240");
    expect(result).toBe(unionpay);
  });

  it("returns the custom brand mask when a custom brand matches", () => {
    const custom17 = { mask: "0000 000000000000 0", cardLength: 17 };
    const masks = [...compiledMasks, custom17];
    const result = getDynamicMask(masks, "8810", { customBrands: [acmeBrand] });
    expect(result).toBe(custom17);
  });

  it("falls back to default mask when no compiled mask exists for the custom brand length", () => {
    // compiledMasks has no 17-digit entry, so it falls through to the default
    const result = getDynamicMask(compiledMasks, "8810", {
      customBrands: [acmeBrand],
    });
    expect(result).toBe(base16);
  });
});
