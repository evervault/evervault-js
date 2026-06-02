import { BrandOptions, CustomBrand } from "types";

export function createBrand(name: string, options: BrandOptions): CustomBrand {
  return {
    name,
    isLocal: true,
    numberValidationRules: {
      luhnCheck: options.numberValidationRules.luhnCheck ?? true,
      ranges: options.numberValidationRules.ranges,
      lengths: options.numberValidationRules.lengths,
    },
    securityCodeValidationRules: {
      lengths: options.securityCodeValidationRules.lengths,
    },
    iconSrc: options.iconSrc,
  };
}
