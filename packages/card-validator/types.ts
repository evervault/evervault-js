export type CardBrandName = 
  "american-express" | 
  "visa" | 
  "mastercard" | 
  "discover" | 
  "jcb" | 
  "diners-club" | 
  "unionpay" | 
  "maestro" | 
  "mir" | 
  "elo" | 
  "hipercard" | 
  "hiper" |
  "szep";

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
  bin: string | null;
  lastFour: string | null;
  isValid: boolean;
}

export type CardExpiryValidationResult = {
  month: string | null;
  year: string | null;
  isValid: boolean;
}

export type CardCVCValidationResult = {
  cvc: String | null;
  isValid: boolean;
}