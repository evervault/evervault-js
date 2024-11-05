import {
  GooglePayButtonColor,
  GooglePayButtonType,
  TransactionDetails,
} from "types";

export interface GooglePayConfig {
  transaction: TransactionDetails;
  type: GooglePayButtonType;
  color: GooglePayButtonColor;
  borderRadius: number;
}
