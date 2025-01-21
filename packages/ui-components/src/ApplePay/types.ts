import {
  ApplePayButtonStyle,
  ApplePayButtonType,
  TransactionDetailsWithDomain,
  ApplePayButtonLocale,
} from "types";

export interface ApplePayConfig {
  transaction: TransactionDetailsWithDomain;
  type: ApplePayButtonType;
  style: ApplePayButtonStyle;
  locale: ApplePayButtonLocale;
  padding?: string;
  borderRadius?: number;
  allowedCardNetworks?: string[];
  //These two allow users to add any additional data to the Apple Pay request that we don't currently support
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentOverrides?: {
    paymentMethodData?: PaymentMethodData[];
    paymentDetails?: PaymentDetailsInit;
  };
  disbursementOverrides?: {
    disbursementDetails?: PaymentDetailsInit;
  };
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

export interface DisbursementContactDetails extends DisbursementContactAddress {
  emailAddress?: string;
  familyName?: string;
  givenName?: string;
  phoneNumber?: string;
}

export interface DisbursementContactAddress {
  addressLines?: string[];
  administrativeArea?: string;
  country?: string;
  countryCode?: string;
  locality?: string;
  postalCode?: string;
  subAdministrativeArea?: string;
  subLocality?: string;
}
