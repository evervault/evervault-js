import type { Styles } from "jss";

export type TranslationsObject = string | { [key: string]: TranslationsObject };

export type ThemeStyles = Partial<Styles>;

export type ThemeObject = {
  fonts?: string[];
  styles?: ThemeStyles;
};

export type ThemeUtilities = {
  media: (property: string, styles: ThemeStyles) => {};
  extend: (theme: ThemeDefinition) => {};
};

export type ThemeFunction = (utilities: ThemeUtilities) => ThemeObject;

export type ThemeDefinition = ThemeObject | ThemeFunction;

export type SelectorType = string | HTMLElement;

type CardExpiry = {
  month: string | null;
  year: string | null;
};

export type CardDetailsPayload = {
  isValid: boolean;
  card: {
    brand: string | undefined;
    number: string | null;
    last4: string | null;
    bin: string | null;
    expiry: CardExpiry;
    cvc: string | null;
  };
  errors: null | Partial<{
    number?: string;
    cvc?: string;
    expiry?: string;
  }>;
};

export type CardDetailsOptions = {
  theme?: ThemeDefinition;
  autoFocus?: boolean;
  hiddenFields?: CardDetailsField[];
  translations?: Partial<CardDetailsTranslations>;
};

export type SwipedCardDetails = {
  brand: string | undefined;
  number: string | null;
  expiry: CardExpiry | null;
  firstName: string | null;
  lastName: string | null;
  last4: string | null;
  bin: string | null;
};

export interface EvervaultFrameClientMessages {
  EV_RESIZE: { height: number };
  EV_FRAME_READY: undefined;
  EV_FRAME_HANDSHAKE: undefined;
}

export interface EvervaultFrameHostMessages {
  EV_INIT: {
    theme?: ThemeObject;
    config?: Object;
  };
  EV_UPDATE: {
    theme?: ThemeObject;
    config?: Object;
  };
}

export interface CardDetailsFrameClientMessages
  extends EvervaultFrameClientMessages {
  EV_SWIPE: SwipedCardDetails;
  EV_CHANGE: CardDetailsPayload;
}

export interface CardDetailsFrameHostMessages
  extends EvervaultFrameHostMessages {
  EV_VALIDATE: undefined;
}

export type CardDetailsField = "number" | "expiry" | "cvc";

type CardFieldTranslations<E> = {
  label?: string;
  placeholder?: string;
  errors?: E;
};

export type CardDetailsTranslations = {
  number: CardFieldTranslations<{ invalid?: string }>;
  expiry: CardFieldTranslations<{ invalid?: string }>;
  cvc: CardFieldTranslations<{ invalid?: string }>;
};

export type PinOptions = {
  theme?: ThemeDefinition;
  length?: number;
  autoFocus?: boolean;
  mode?: "numeric" | "alphanumeric";
  inputType?: "number" | "text" | "password";
};

export type PinPayload = {
  isComplete: boolean;
  value: string | null;
};

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

export type RevealFormat = {
  regex: RegExp;
  replace: string;
};
