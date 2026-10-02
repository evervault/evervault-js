// What a card field declares about how its value is judged and reported.
export interface CardFieldSettings {
  errorMessage?: string;
  unsupportedBrandMessage?: string;
  pattern?: string;
  optional?: boolean;
  allow3DigitAmex?: boolean;
}
