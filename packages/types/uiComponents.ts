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
  | "american-express"
  | "visa"
  | "mastercard"
  | "discover"
  | "jcb"
  | "diners-club"
  | "unionpay"
  | "maestro"
  | "mir"
  | "elo"
  | "hipercard"
  | "hiper"
  | "szep"
  | "uatp"
  | "rupay";

export interface CardExpiry {
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

export interface FieldEvent {
  field: CardField;
  data: CardPayload;
}

interface CardFieldTranslations<E extends TranslationsObject>
  extends TranslationsObject {
  label?: string;
  placeholder?: string;
  errors?: E;
}

export interface CardTranslations extends TranslationsObject {
  number: CardFieldTranslations<{
    invalid?: string;
    unsupportedBrand?: string;
  }>;
  expiry: CardFieldTranslations<{ invalid?: string }>;
  cvc: CardFieldTranslations<{ invalid?: string }>;
}

export type CardIcons = Record<CardBrandName | "default", string>;

export interface CardOptions {
  icons?: boolean | CardIcons;
  theme?: ThemeDefinition;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[]; // deprecated
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  translations?: Partial<CardTranslations>;
  autoProgress?: boolean;
  redactCVC?: boolean;
  allow3DigitAmexCVC?: boolean;
  defaultValues?: {
    name?: string;
  };
  autoComplete?: {
    name?: boolean;
    number?: boolean;
    expiry?: boolean;
    cvc?: boolean;
  };
}

export interface FormOptions {
  theme?: ThemeDefinition;
  formUuid?: string;
  formSubmissionUrl?: string;
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

export interface ComponentError {
  code: string;
  message: string;
}

export interface EvervaultFrameClientMessages {
  EV_ERROR: ComponentError | undefined;
  EV_RESIZE: { height: number; width?: number };
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
  EV_VALIDATED: CardPayload;
  EV_FOCUS: CardField;
  EV_BLUR: CardField;
  EV_KEYDOWN: CardField;
  EV_KEYUP: CardField;
}

export interface CardFrameHostMessages extends EvervaultFrameHostMessages {
  EV_VALIDATE: undefined;
  EV_UPDATE_NAME: string;
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

export interface FormFrameClientMessages extends EvervaultFrameClientMessages {
  EV_ERROR: undefined;
  EV_SUBMITTED: undefined;
}

export interface ThreeDSecureOptions {
  theme?: ThemeDefinition;
  size?: { width: string; height: string };
  failOnChallenge?: boolean | (() => boolean) | (() => Promise<boolean>);
}

export interface ThreeDSecureFrameHostMessages
  extends EvervaultFrameHostMessages {
  EV_FAIL_ON_CHALLENGE_RESULT: boolean;
}

export interface ThreeDSecureFrameClientMessages
  extends EvervaultFrameClientMessages {
  EV_SUCCESS: string | undefined | null;
  EV_FAILURE: string | undefined | null;
  EV_FAILURE_FORCED_DUE_TO_CHALLENGE: string | undefined | null;
  EV_FAIL_ON_CHALLENGE: undefined;
  EV_CANCEL: undefined;
}

export interface GooglePayClientMessages extends EvervaultFrameClientMessages {
  EV_GOOGLE_PAY_AUTH: EncryptedGooglePayData;
  EV_GOOGLE_PAY_CANCELLED: undefined;
  EV_GOOGLE_PAY_ERROR: string;
  EV_GOOGLE_PAY_SUCCESS: undefined;
}

export interface GooglePayHostMessages extends EvervaultFrameHostMessages {
  EV_GOOGLE_PAY_AUTH_COMPLETE: undefined;
  EV_GOOGLE_PAY_AUTH_ERROR: GooglePayErrorMessage;
  EV_GOOGLE_PAY_SUCCESS: undefined;
}

export interface ApplePayHostMessages extends EvervaultFrameHostMessages {
  EV_APPLE_PAY_COMPLETION: undefined;
  EV_APPLE_PAY_AUTH_ERROR: ApplePayErrorMessage;
  EV_APPLE_PAY_SUCCESS: undefined;
}

export type EncryptedApplePayData = Omit<EncryptedDPAN<"apple">, "token"> & {
  networkToken: PaymentToken<"apple"> & { rawExpiry: string };
  billingContact?: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    address?: unknown;
  };
  paymentDataType: string;
  deviceManufacturerIdentifier: string;
  shippingContact?: {
    givenName?: string;
    familyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
};

export interface ApplePayClientMessages extends EvervaultFrameClientMessages {
  EV_APPLE_PAY_AUTH: EncryptedApplePayData;
  EV_APPLE_PAY_CANCELLED: undefined;
  EV_APPLE_PAY_ERROR: string;
  EV_APPLE_PAY_SUCCESS: undefined;
}

export type GooglePayButtonType =
  | "book"
  | "buy"
  | "checkout"
  | "donate"
  | "order"
  | "pay"
  | "plain"
  | "subscribe";

export type GooglePayButtonColor = "black" | "white";

export type GooglePayButtonLocale =
  | "en"
  | "ar"
  | "bg"
  | "ca"
  | "cs"
  | "da"
  | "de"
  | "el"
  | "es"
  | "et"
  | "fi"
  | "fr"
  | "hr"
  | "id"
  | "it"
  | "ja"
  | "ko"
  | "ms"
  | "nl"
  | "no"
  | "pl"
  | "pt"
  | "ru"
  | "sk"
  | "sl"
  | "sr"
  | "sv"
  | "th"
  | "tr"
  | "uk"
  | "zh";

interface PaymentToken<P> {
  tokenServiceProvider: P;
  number: string;
  expiry: {
    month: string;
    year: string;
  };
}

export interface EncryptedDPAN<P> {
  token: PaymentToken<P>;
  card: {
    brand: string;
    lastFour?: string;
    displayName?: string;
  };
  cryptogram: string;
  eci: string;
}

export interface EncryptedFPAN {
  card: {
    brand: string;
    number: string;
    lastFour?: string;
    displayName?: string;
    expiry: {
      month: string;
      year: string;
    };
  };
}

export type EncryptedGooglePayData = (
  | EncryptedDPAN<"google">
  | EncryptedFPAN
) & {
  billingAddress?: google.payments.api.Address | null;
};

export interface GooglePayErrorMessage {
  message: string;
  reason?: google.payments.api.ErrorReason;
  intent?: google.payments.api.CallbackIntent;
}

export type GooglePayBillingAddressConfig =
  | boolean
  | {
      format?: google.payments.api.BillingAddressFormat;
      phoneNumber?: boolean;
    };

export interface GooglePayOptions {
  process: (
    data: EncryptedGooglePayData,
    helpers: {
      fail: (error: GooglePayErrorMessage) => void;
    }
  ) => Promise<void>;
  type?: GooglePayButtonType;
  color?: GooglePayButtonColor;
  locale?: GooglePayButtonLocale;
  borderRadius?: number;
  size?: { width: WalletDimension; height: WalletDimension };
  allowedAuthMethods?: google.payments.api.CardAuthMethod[];
  allowedCardNetworks?: google.payments.api.CardNetwork[];
  billingAddress?: GooglePayBillingAddressConfig;
}

export type ApplePayButtonType =
  | "add-money"
  | "book"
  | "buy"
  | "check-out"
  | "continue"
  | "contribute"
  | "donate"
  | "order"
  | "pay"
  | "plain"
  | "reload"
  | "rent"
  | "set-up"
  | "subscribe"
  | "support"
  | "tip"
  | "top-up";

export type ApplePayButtonStyle = "black" | "white" | "white-outline";

export type ApplePayButtonLocale =
  | "ar-AB"
  | "ca-ES"
  | "cs-CZ"
  | "da-DK"
  | "de-DE"
  | "el-GR"
  | "en-AU"
  | "en-GB"
  | "en-US"
  | "es-ES"
  | "es-MX"
  | "fi-FI"
  | "fr-CA"
  | "fr-FR"
  | "he-IL"
  | "hi-IN"
  | "hr-HR"
  | "hu-HU"
  | "id-ID"
  | "it-IT"
  | "ja-JP"
  | "ko-KR"
  | "ms-MY"
  | "nb-NO"
  | "nl-NL"
  | "pl-PL"
  | "pt-BR"
  | "pt-PT"
  | "ro-RO"
  | "ru-RU"
  | "sk-SK"
  | "sv-SE"
  | "th-TH"
  | "tr-TR"
  | "uk-UA"
  | "vi-VN"
  | "zh-CN"
  | "zh-HK"
  | "zh-TW";

export type ApplePayCardNetwork =
  | "amex"
  | "bancomat"
  | "bancontact"
  | "cartesBancaires"
  | "chinaUnionPay"
  | "dankort"
  | "discover"
  | "eftpos"
  | "electron"
  | "elo"
  | "girocard"
  | "interac"
  | "jcb"
  | "mada"
  | "maestro"
  | "masterCard"
  | "mir"
  | "privateLabel"
  | "visa"
  | "vPay";

export interface ApplePayErrorMessage {
  message: string;
}

export interface ApplePayOptions {
  process: (
    data: EncryptedApplePayData,
    helpers: {
      fail: (error: ApplePayErrorMessage) => void;
    }
  ) => Promise<void>;
  type?: ApplePayButtonType;
  style?: ApplePayButtonStyle;
  locale?: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: number;
  size?: { width: WalletDimension; height: WalletDimension };
  allowedCardNetworks?: ApplePayCardNetwork[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
  requestPayerDetails?: ("name" | "email" | "phone")[];
}

export type WalletDimension = string | number;

export interface TransactionLineItem {
  amount: number;
  label: string;
}

export interface InstantTransferDetails {
  label: string;
  amount: number;
}

// Base transaction interface with common fields
interface BaseTransactionDetails {
  amount: number;
  currency: string;
  country: string;
  merchantId: string;
  lineItems?: TransactionLineItem[];
}

// Payment-specific fields
export interface PaymentTransactionDetails extends BaseTransactionDetails {
  type: "payment";
}

export interface RecurringTransactionDetails extends BaseTransactionDetails {
  type: "recurring";
  managementURL: string;
  billingAgreement: string;
  description: string;
  regularBilling: TransactionLineItem & {
    recurringPaymentStartDate: Date;
  };
  trialBilling?: TransactionLineItem & {
    trialPaymentStartDate: Date;
  };
}

// Disbursement-specific fields
export type RequiredRecipientDetail = "email" | "phone" | "name" | "address";
export interface DisbursementTransactionDetails extends BaseTransactionDetails {
  type: "disbursement";
  instantTransfer?: InstantTransferDetails;
  requiredRecipientDetails?: RequiredRecipientDetail[];
}

export type TransactionDetails =
  | PaymentTransactionDetails
  | RecurringTransactionDetails
  | DisbursementTransactionDetails;

export type TransactionDetailsWithDomain = TransactionDetails & {
  domain: string;
};

export type CreateTransactionDetails = Omit<
  PaymentTransactionDetails,
  "type"
> & { type?: "payment" };

export interface ApplePayToken {
  version: string;
  data: string;
  signature: string;
  header: {
    ephemeralPublicKey?: string;
    wrappedKey?: string;
    publicKeyHash: string;
    transactionId: string;
    applicatoinData?: string;
  };
}

export interface MerchantDetail {
  id: string;
  name: string;
}
