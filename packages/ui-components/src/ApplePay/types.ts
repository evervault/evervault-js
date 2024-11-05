import { ApplePayButtonType, TransactionDetails } from "types";

export interface ApplePayConfig {
  transaction: TransactionDetails;
  type: ApplePayButtonType;
}
