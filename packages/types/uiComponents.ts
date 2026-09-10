import type { Styles } from "jss";

type ColorSchemeValue = "light" | "dark";
export type ColorScheme =
  | "normal"
  | ColorSchemeValue
  | `only ${ColorSchemeValue}`
  | "light dark";

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

export const CARD_BRAND_NAMES: CardBrandName[] = [
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
];

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

export interface BrandOptions {
  numberValidationRules: {
    luhnCheck?: boolean;
    ranges: Array<number | [number, number]>;
    lengths: number[];
  };
  securityCodeValidationRules: {
    lengths: (3 | 4)[];
  };
  iconSrc?: string;
}

export interface CustomBrand {
  name: string;
  isLocal: true;
  numberValidationRules: {
    luhnCheck: boolean;
    ranges: Array<number | [number, number]>;
    lengths: number[];
  };
  securityCodeValidationRules: {
    lengths: (3 | 4)[];
  };
  iconSrc?: string;
}

export interface CardOptions {
  colorScheme?: ColorScheme;
  icons?: boolean | Partial<CardIcons>;
  theme?: ThemeDefinition;
  autoFocus?: boolean;
  hiddenFields?: ("number" | "expiry" | "cvc")[]; // deprecated
  fields?: CardField[];
  acceptedBrands?: CardBrandName[];
  customBrands?: CustomBrand[];
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
  validation?: {
    name?: {
      regex?: RegExp;
    };
    cvc?: {
      optional?: boolean;
    };
  };
}

export interface FormOptions {
  colorScheme?: ColorScheme;
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
  EV_RESIZE: {
    height: number;
    width?: number;
    minWidth?: number;
    minHeight?: number;
  };
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
  colorScheme?: ColorScheme;
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
  colorScheme?: ColorScheme;
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
  EV_GOOGLE_PAY_DATA_CHANGE: GooglePayDataChangeRequest;
}

export interface GooglePayHostMessages extends EvervaultFrameHostMessages {
  EV_GOOGLE_PAY_AUTH_COMPLETE: undefined;
  EV_GOOGLE_PAY_AUTH_ERROR: GooglePayErrorMessage;
  EV_GOOGLE_PAY_SUCCESS: undefined;
  EV_GOOGLE_PAY_DATA_CHANGE_RESULT: GooglePayDataChangeResponse;
}

export interface ApplePayHostMessages extends EvervaultFrameHostMessages {
  EV_APPLE_PAY_COMPLETION: undefined;
  EV_APPLE_PAY_AUTH_ERROR: ApplePayErrorMessage;
  EV_APPLE_PAY_SUCCESS: undefined;
}

export type ApplePayTransactionType = "oneOff" | "recurring" | "disbursement";

export interface ApplePayCardEnrichment {
  funding?: string;
  segment?: string;
  country?: string;
  currency?: string;
  issuer?: string;
}

export type EncryptedApplePayData = Omit<
  EncryptedDPAN<"apple">,
  "token" | "card"
> & {
  networkToken: PaymentToken<"apple"> & { rawExpiry: string };
  card: EncryptedDPAN<"apple">["card"] & ApplePayCardEnrichment;
  billingContact?: {
    givenName?: string;
    familyName?: string;
    phoneticGivenName?: string;
    phoneticFamilyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
    address?: unknown;
  };
  paymentDataType: string;
  transactionType: ApplePayTransactionType;
  transactionId: string;
  deviceManufacturerIdentifier: string;
  shippingContact?: {
    givenName?: string;
    familyName?: string;
    phoneticGivenName?: string;
    phoneticFamilyName?: string;
    emailAddress?: string;
    phoneNumber?: string;
  };
  /**
   * Set when `requestPayerDetails` is used. Apple Pay collects these on the
   * shipping contact, so they also appear on `shippingContact`.
   */
  payerName?: string;
  payerEmail?: string;
  payerPhone?: string;
  /**
   * The shipping method the customer selected on the Apple Pay sheet.
   * Present when `shippingMethods` were configured on the web Apple Pay button.
   */
  shippingMethod?: {
    id: string;
    label: string;
    amount: number;
    detail?: string;
  };
};

export interface ApplePayClientMessages extends EvervaultFrameClientMessages {
  EV_APPLE_PAY_AUTH: EncryptedApplePayData;
  EV_APPLE_PAY_CANCELLED: undefined;
  EV_APPLE_PAY_ERROR: string;
  EV_APPLE_PAY_SUCCESS: undefined;
}

export type GooglePayButtonType =
  | "short"
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

export type PaymentMethodType = "credit" | "debit" | "prepaid" | "store";

export interface EncryptedDPAN<P> {
  token: PaymentToken<P>;
  card: {
    brand: string;
    lastFour?: string;
    displayName?: string;
    paymentMethodType?: PaymentMethodType;
  };
  cryptogram: string;
  eci: string;
  messageId?: string;
  messageExpiration?: string;
}

export interface EncryptedFPAN {
  card: {
    brand: string;
    number: string;
    lastFour?: string;
    displayName?: string;
    paymentMethodType?: PaymentMethodType;
    expiry: {
      month: string;
      year: string;
    };
  };
  messageId?: string;
  messageExpiration?: string;
}

export type EncryptedGooglePayData = (
  | EncryptedDPAN<"google">
  | EncryptedFPAN
) & {
  email?: string | null;
  billingAddress?: google.payments.api.Address | null;
  /**
   * The address the buyer chose in the sheet. Present when shipping-address
   * collection was enabled directly or through `shippingOptions`.
   */
  shippingAddress?: google.payments.api.Address | null;
  /**
   * The shipping option the buyer chose in the sheet. Present only when
   * `shippingOptions` were configured on the Google Pay button.
   */
  shippingOption?: GooglePayShippingOption | null;
  assuranceDetails?: google.payments.api.AssuranceDetails | null;
};

export interface GooglePayErrorMessage {
  message: string;
  reason?: google.payments.api.ErrorReason;
  intent?: google.payments.api.CallbackIntent;
}

export type GooglePayShippingAddressParameters =
  google.payments.api.ShippingAddressParameters;

export type GooglePayShippingAddressConfig =
  | boolean
  | GooglePayShippingAddressParameters;

export type GooglePayShippingOption = google.payments.api.SelectionOption & {
  /**
   * Optional shipping cost in minor units. Google Pay does not display this
   * field automatically. Include it in `label` when buyers must see the price.
   */
  amount?: number;
};

export interface GooglePayShippingOptionsConfig {
  options: GooglePayShippingOption[];
  /** Defaults to the first option when omitted, matching Google's own default. */
  defaultSelectedOptionId?: string;
}

/** The current shipping state when Google Pay asks for an update. */
export interface GooglePayShippingContext {
  trigger: google.payments.api.CallbackTrigger;
  shippingAddress?: google.payments.api.IntermediateAddress | null;
  selectedShippingOption?: GooglePayShippingOption | null;
  /** The current total in the currency's minor units. */
  amount: number;
  lineItems?: TransactionLineItem[];
  shippingOptions?: GooglePayShippingOptionsConfig;
}

/**
 * A successful patch for the open sheet. Omitted fields retain their current
 * values. Amounts use the currency's minor units, like `transaction.amount`.
 */
export interface GooglePayDataChangeSuccess {
  amount?: number;
  lineItems?: TransactionLineItem[];
  shippingOptions?: GooglePayShippingOptionsConfig;
  error?: never;
}

/** Rejects the buyer's current selection and shows an error in the sheet. */
export interface GooglePayDataChangeFailure {
  error: GooglePayErrorMessage;
  amount?: never;
  lineItems?: never;
  shippingOptions?: never;
}

export type GooglePayDataChangeUpdate =
  | GooglePayDataChangeSuccess
  | GooglePayDataChangeFailure;

/** Internal message used to run a merchant callback outside the payment frame. */
export interface GooglePayDataChangeRequest extends GooglePayShippingContext {
  /** Correlates this request with its asynchronous response. */
  id: string;
}

export type GooglePayDataChangeResponse = GooglePayDataChangeUpdate & {
  id: string;
};

export type GooglePayBillingAddressConfig =
  | boolean
  | {
      format?: google.payments.api.BillingAddressFormat;
      phoneNumber?: boolean;
    };

export interface GooglePayOptions {
  emailRequired?: boolean;
  process: (
    data: EncryptedGooglePayData,
    helpers: {
      fail: (error: GooglePayErrorMessage) => void;
    }
  ) => Promise<void>;
  colorScheme?: ColorScheme;
  type?: GooglePayButtonType;
  color?: GooglePayButtonColor;
  locale?: GooglePayButtonLocale;
  borderRadius?: number;
  size?: { width: WalletDimension; height: WalletDimension };
  allowedAuthMethods?: google.payments.api.CardAuthMethod[];
  allowedCardNetworks?: google.payments.api.CardNetwork[];
  billingAddress?: GooglePayBillingAddressConfig;
  /**
   * Collect a shipping address in the sheet. Pass `true` for any supported
   * country, or parameters to restrict countries / request a phone number.
   */
  shippingAddress?: GooglePayShippingAddressConfig;
  /**
   * Offer shipping options in the sheet. This also enables shipping-address
   * collection when `shippingAddress` is omitted.
   */
  shippingOptions?: GooglePayShippingOptionsConfig;
  /**
   * Called when the buyer picks or changes their shipping address, while the
   * sheet is still open. Return updated totals, line items or options. The
   * callback has 10 seconds to complete.
   */
  onShippingAddressChange?: (
    address: google.payments.api.IntermediateAddress,
    context: GooglePayShippingContext
  ) =>
    | GooglePayDataChangeUpdate
    | void
    | Promise<GooglePayDataChangeUpdate | void>;
  /**
   * Called when the buyer picks a different shipping option. The callback has
   * 10 seconds to complete.
   */
  onShippingOptionChange?: (
    option: GooglePayShippingOption,
    context: GooglePayShippingContext
  ) =>
    | GooglePayDataChangeUpdate
    | void
    | Promise<GooglePayDataChangeUpdate | void>;
  theme?: ThemeDefinition;
  /**
   * Whether to show a 'Continue' or 'Pay Now' button on the Google Pay sheet.
   * @default "DEFAULT"
   */
  checkoutOption?: google.payments.api.CheckoutOption;
  /**
   * A merchant-generated ID for this transaction, used for fraud correlation.
   */
  transactionId?: string;
  /**
   * Whether the total price is known and final, or still an estimate.
   *
   * `"NOT_CURRENTLY_KNOWN"` isn't supported — same as Android and our
   * current shipping implementation.
   * @default "FINAL"
   */
  totalPriceStatus?: Exclude<
    google.payments.api.TotalPriceStatus,
    "NOT_CURRENTLY_KNOWN"
  >;
  /** @default true */
  allowPrepaidCards?: boolean;
  /** @default true */
  allowCreditCards?: boolean;
  /**
   * Identifies the software used to integrate with Google Pay, for Google's
   * own metrics.
   */
  softwareInfo?: google.payments.api.SoftwareInfo;
  /**
   * When true, requests that Google Pay perform cardholder ID&V/possession
   * checks and return the result as `assuranceDetails` on the payment method.
   */
  assuranceDetailsRequired?: boolean;
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
  appleMerchantId?: string;
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

export type TransactionLineItemType = "final" | "pending";

export interface TransactionLineItem {
  amount: number;
  label: string;
  /**
   * Whether the line item amount is final or still pending (e.g. tax/shipping).
   * Maps to Apple Pay `ApplePayLineItem.type` / Payment Request `PaymentItem.pending`.
   * Defaults to `"final"` when omitted.
   */
  type?: TransactionLineItemType;
  /**
   * The kind of line item, for platforms that distinguish it (currently Google
   * Pay only, where it maps to `displayItems[].type`). Has no effect on Apple
   * Pay or disbursements. Defaults to `"line_item"` when omitted.
   */
  category?: "line_item" | "subtotal" | "tax" | "discount" | "shipping_option";
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
  priceLabel?: string;
  lineItems?: TransactionLineItem[];
}

// Payment-specific fields
export interface PaymentTransactionDetails extends BaseTransactionDetails {
  type: "payment";
}

export type RecurringPaymentIntervalUnit =
  | "minute"
  | "hour"
  | "day"
  | "week"
  | "month"
  | "year";

export interface RecurringTransactionDetails extends BaseTransactionDetails {
  type: "recurring";
  managementURL: string;
  billingAgreement: string;
  description: string;
  regularBilling: TransactionLineItem & {
    recurringPaymentStartDate: Date;
    recurringPaymentIntervalUnit?: RecurringPaymentIntervalUnit;
    recurringPaymentIntervalCount?: number;
  };
  trialBilling?: TransactionLineItem & {
    trialPaymentStartDate: Date;
  };
}

// Disbursement-specific fields
export type RequiredRecipientDetail = "email" | "phone" | "name" | "address";

export type ApplePayMerchantCapability =
  | "supports3DS"
  | "supportsEMV"
  | "supportsCredit"
  | "supportsDebit"
  | "supportsInstantFundsOut";

export interface DisbursementTransactionDetails extends BaseTransactionDetails {
  type: "disbursement";
  instantTransfer?: InstantTransferDetails;
  requiredRecipientDetails?: RequiredRecipientDetail[];
  merchantCapabilities?: ApplePayMerchantCapability[];
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

export interface AppSDKConfig {
  is_sandbox: boolean;
}
