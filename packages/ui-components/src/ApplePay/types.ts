import {
  ApplePayButtonStyle,
  ApplePayButtonType,
  TransactionDetails,
  ApplePayPaymentRequest,
  ApplePayButtonLocale,
} from "types";

export interface ApplePayConfig {
  transaction: TransactionDetails;
  type: ApplePayButtonType;
  style: ApplePayButtonStyle;
  locale: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: number;
  allowedCardNetworks?: string[];
  //These two allow users to add any additional data to the Apple Pay request that we don't currently support
  paymentMethodsDataOverrides?: { [key: string]: any };
  paymentDetailsModifiers?: PaymentDetailsModifier[];
}

export interface ValidateMerchantResponse {
  sessionData: {
    displayName: string;
    domainName: string;
    epochTimestamp: number;
    expiresAt: number;
    merchantIdentifier: string;
    merchantSessionIdentifier: string;
    nonce: string;
    operationalAnalyticsIdentifier: string;
    pspId: string;
    retries: number;
    signature: string;
  };
}
