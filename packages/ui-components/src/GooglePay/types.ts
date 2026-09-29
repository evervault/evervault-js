import {
  GooglePayBillingAddressConfig,
  GooglePayButtonColor,
  GooglePayButtonType,
  GooglePayShippingAddressConfig,
  GooglePayShippingOptionsConfig,
  TransactionDetailsWithDomain,
} from "types";

export interface GooglePayConfig {
  transaction: TransactionDetailsWithDomain;
  type: GooglePayButtonType;
  color: GooglePayButtonColor;
  locale?: string;
  borderRadius?: number;
  allowedAuthMethods?: string[];
  allowedCardNetworks?: string[];
  billingAddress?: GooglePayBillingAddressConfig;
  shippingAddress?: GooglePayShippingAddressConfig;
  shippingOptions?: GooglePayShippingOptionsConfig;
  emailRequired?: boolean;
  checkoutOption?: google.payments.api.CheckoutOption;
  transactionId?: string;
  totalPriceStatus?: Exclude<
    google.payments.api.TotalPriceStatus,
    "NOT_CURRENTLY_KNOWN"
  >;
  allowPrepaidCards?: boolean;
  allowCreditCards?: boolean;
  softwareInfo?: google.payments.api.SoftwareInfo;
  assuranceDetailsRequired?: boolean;
  existingPaymentMethodRequired?: boolean;
  prefetchPaymentData?: boolean;
}
