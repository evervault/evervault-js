import {
  GooglePayBillingAddressConfig,
  GooglePayButtonColor,
  GooglePayButtonType,
  GooglePayOffer,
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
  offers?: GooglePayOffer[];
  emailRequired?: boolean;
}
