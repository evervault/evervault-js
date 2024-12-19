import {
  GooglePayButtonColor,
  GooglePayButtonType,
  TransactionDetails,
} from "types";

export interface GooglePayConfig {
  transaction: TransactionDetails;
  type: GooglePayButtonType;
  color: GooglePayButtonColor;
  locale?: string;
  borderRadius: number;
  allowedAuthMethods?: string[];
  allowedCardNetworks?: string[];
}
