export const CARD_BRAND_NAMES = [
  "american-express",
  "visa",
  "mastercard",
  "discover",
  "jcb",
  "diners-club",
  "unionpay",
  "maestro",
  "mir",
  "elo",
  "hipercard",
  "hiper",
  "szep",
  "uatp",
  "rupay",
] as const;

export type CardBrandName = (typeof CARD_BRAND_NAMES)[number];

export interface CardConfig {
  /**
   * The brands that are accepted by the card form.
   * Pass an empty array to accept all brands.
   *
   * @default []
   */
  acceptedBrands?: CardBrandName[];
}

export type CardField = "name" | "number" | "expiry" | "cvc";

export interface CardExpiry {
  month: string;
  year: string;
}

export interface CardPayload {
  card: {
    name: string | null;
    brand: CardBrandName | null;
    localBrands: CardBrandName[];
    number: string | null;
    lastFour: string | null;
    bin: string | null;
    expiry: CardExpiry | null;
    cvc: string | null;
  };
  /**
   * Each `Card.Field`'s value encrypted, by name; null when empty or invalid.
   * Present only when the card declares one.
   */
  fields?: Record<string, string | null>;
  isValid: boolean;
  isComplete: boolean;
  errors: {
    name?: string;
    number?: string;
    expiry?: string;
    cvc?: string;
    fields?: Record<string, string>;
  };
}
