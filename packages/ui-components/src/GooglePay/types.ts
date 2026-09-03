import {
  GooglePayBillingAddressConfig,
  GooglePayButtonColor,
  GooglePayButtonType,
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
  emailRequired?: boolean;
  checkoutOption?: google.payments.api.CheckoutOption;
  transactionId?: string;
  totalPriceStatus?: google.payments.api.TotalPriceStatus;
  allowPrepaidCards?: boolean;
  allowCreditCards?: boolean;
  softwareInfo?: google.payments.api.SoftwareInfo;
}
