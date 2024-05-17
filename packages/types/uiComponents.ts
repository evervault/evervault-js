import type { Styles } from "jss";

export interface TranslationsObject {
  [key: string]: string | TranslationsObject | undefined;
}

export type ThemeStyles = Partial<Styles>;

export interface UIComponentMessageDetail {
  type: string;
  payload: unknown;
}

export interface ThemeObject {
  fonts?: string[];
  styles?: ThemeStyles;
}

export type ThemeFunction = (utilities: ThemeUtilities) => ThemeObject;

export type ThemeDefinition = ThemeObject | ThemeFunction;

export interface ThemeUtilities {
  media: (property: string, styles: ThemeStyles) => object;
  extend: (theme: ThemeDefinition) => object;
}

export type SelectorType = string | HTMLElement;

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

interface CardExpiry {
  month: string | null;
  year: string | null;
}

export interface CardPayload {
  card: {
    name: string | null;
    brand: string | null;
    localBrands: string[] | null;
    number: string | null;
    lastFour: string | null;
    bin: string | null;
    expiry: CardExpiry;
    cvc: string | null;
  };
  isValid: boolean;
  isComplete: boolean;
  errors: null | Partial<{
    number?: string;
    cvc?: string;
    expiry?: string;
  }>;
}

export type CardField = "name" | "number" | "expiry" | "cvc";

interface CardFieldTranslations<E extends TranslationsObject>
  extends TranslationsObject {
  label?: string;
  placeholder?: string;
  errors?: E;
}

export interface CardTranslations extends TranslationsObject {
  number: CardFieldTranslations<{ invalid?: string, unsupportedBrand?: string }>;
  expiry: CardFieldTranslations<{ invalid?: string }>;
  cvc: CardFieldTranslations<{ invalid?: string }>;
}

export interface CardOptions {
  theme?: ThemeDefinition;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[]; // deprecated
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
}

export interface FormOptions {
  theme?: ThemeDefinition;
  formUuid: string;
}

export interface SwipedCard {
  brand: string | null;
  localBrands: string[] | null;
  number: string | null;
  expiry: CardExpiry | null;
  firstName: string | null;
  lastName: string | null;
  lastFour: string | null;
  bin: string | null;
}

export interface EvervaultFrameClientMessages {
  EV_RESIZE: { height: number };
  EV_FRAME_READY: undefined;
  EV_FRAME_HANDSHAKE: undefined;
}

export interface EvervaultFrameHostMessages {
  EV_INIT: {
    theme?: ThemeObject;
    config?: unknown;
  };
  EV_UPDATE: {
    theme?: ThemeObject;
    config?: unknown;
  };
}

export interface CardFrameClientMessages extends EvervaultFrameClientMessages {
  EV_SWIPE: SwipedCard;
  EV_CHANGE: CardPayload;
  EV_COMPLETE: CardPayload;
}

export interface CardFrameHostMessages extends EvervaultFrameHostMessages {
  EV_VALIDATE: undefined;
}

export interface PinOptions {
  theme?: ThemeDefinition;
  length?: number;
  autoFocus?: boolean;
  mode?: "numeric" | "alphanumeric";
  inputType?: "number" | "text" | "password";
}

export interface PinPayload {
  isComplete: boolean;
  value: string | null;
}

export interface PinFrameClientMessages extends EvervaultFrameClientMessages {
  EV_CHANGE: PinPayload;
  EV_COMPLETE: PinPayload;
}

export interface RevealRequestClientMessages
  extends EvervaultFrameClientMessages {
  EV_REVEAL_REQUEST_READY: undefined;
  EV_ERROR: undefined;
}

export interface RevealConsumerClientMessages
  extends EvervaultFrameClientMessages {
  EV_COPY: undefined;
  EV_REVEAL_CONSUMER_READY: undefined;
  EV_REVEAL_CONSUMER_ERROR: string;
}

export interface RevealFormat {
  regex: RegExp;
  replace: string;
}

export interface FormPayload {
  value: string;
  isComplete: boolean;
}

export interface FormFrameClientMessages extends EvervaultFrameClientMessages {
  EV_CHANGE: FormPayload;
  EV_COMPLETE: FormPayload;
}
