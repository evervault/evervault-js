import {
  ApplePayButtonStyle,
  ApplePayButtonType,
  TransactionDetails,
} from "types";

export interface ApplePayConfig {
  transaction: TransactionDetails;
  type: ApplePayButtonType;
  style: ApplePayButtonStyle;
  padding?: string;
  borderRadius?: number;
}
