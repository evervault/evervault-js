import { CardBrandName } from "types";

export type NumberValidationRules = {
  luhnCheck: boolean;
  ranges: number[] | [number[]];
  lengths: number[];
}

export type SecurityCodeValidationRules = {
  length: number;
}

export type CardBrand = {
  name: CardBrandName;
  isLocal: boolean;
  numberValidationRules: NumberValidationRules;
  securityCodeValidationRules: SecurityCodeValidationRules;
}

export type CardValidationOptions = {
  acceptedBrands?: CardBrandName[];
}

export type CardNumberValidationResult = {
  brand: CardBrandName | null;
  localBrands: CardBrandName[];
  bin: string | null | undefined;
  lastFour: string | null | undefined;
  isValid: boolean;
}

export type CardExpiryValidationResult = {
  month: string | null | undefined;
  year: string | null | undefined;
  isValid: boolean;
}

export type CardCVCValidationResult = {
  cvc: string | null | undefined;
  isValid: boolean;
}
