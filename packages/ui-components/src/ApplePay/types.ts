import {
  ApplePayButtonStyle,
  ApplePayButtonType,
  TransactionDetails,
  ApplePayPaymentRequest,
} from "types";

export interface ApplePayConfig {
  transaction: TransactionDetails;
  type: ApplePayButtonType;
  style: ApplePayButtonStyle;
  padding?: string;
  borderRadius?: number;
  paymentRequest?: ApplePayPaymentRequest;
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
