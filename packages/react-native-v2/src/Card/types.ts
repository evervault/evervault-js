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
] as const;

export type CardBrandName = (typeof CARD_BRAND_NAMES)[number];

export interface CardConfig {
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
    brand: string | null;
    localBrands: string[] | null;
    number: string | null;
    lastFour: string | null;
    bin: string | null;
    expiry: CardExpiry | null;
    cvc: string | null;
  };
  isValid: boolean;
  isComplete: boolean;
  errors: null | Partial<{
    name?: string;
    number?: string;
    expiry?: string;
    cvc?: string;
  }>;
}
