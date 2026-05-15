import { CardBrandName } from "types";

export type NumberValidationRules = {
  luhnCheck: boolean;
  ranges: number[] | [number[]];
  lengths: number[];
};

export type SecurityCodeValidationRules = {
  lengths: number[];
};

export type CardBrand = {
  name: CardBrandName;
  isLocal: boolean;
  numberValidationRules: NumberValidationRules;
  securityCodeValidationRules: SecurityCodeValidationRules;
};

export type CardValidationOptions = {
  acceptedBrands?: CardBrandName[];
};

export type CardNumberValidationResult = {
  brand: CardBrandName | null;
  localBrands: CardBrandName[];
  bin: string | null;
  lastFour: string | null;
  isValid: boolean;
};

export type CardExpiryValidationResult = {
  month: string | null;
  year: string | null;
  isValid: boolean;
};

export type CardCVCValidationResult =
  | {
      cvc: string;
      isValid: true;
    }
  | {
      cvc: null;
      isValid: false;
      reason: "invalid_cvc" | "invalid_number" | "invalid_brand_cvc";
    };
