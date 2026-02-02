import { CardBrandName } from "types";

export type NumberValidationRules = {
  luhnCheck: boolean;
  ranges: Array<number | [number, number]>;
  lengths: number[];
};

export type SecurityCodeValidationRules = {
  lengths: number[];
};

type BrandDefinition<
  N extends string = string,
  Local extends boolean = boolean
> = {
  name: N;
  isLocal: Local;
  numberValidationRules: NumberValidationRules;
  securityCodeValidationRules: SecurityCodeValidationRules;
};

export type DefaultBrand = BrandDefinition<CardBrandName>;
export type CustomBrand = BrandDefinition<string, true>;

/** @deprecated Use {@link DefaultBrand} instead */
export type CardBrand = DefaultBrand;

/** @deprecated No longer used internally */
export type CardValidationOptions = {
  acceptedBrands?: CardBrandName[];
};

export type CardNumberValidationOptions = {
  customBrands?: CustomBrand[];
};

export type CardNumberValidationResult = {
  brand: CardBrandName | null;
  localBrands: string[];
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
