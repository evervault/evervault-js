// import {
//   ApplePayResponse,
//   CardNetwork,
//   Config,
//   Transaction,
// } from "../specs/ApplePayButtonNativeComponent";
import { NativeProps } from "../specs/ApplePayButtonViewNativeComponent";

export type FinishWithResultEvent =
  | { success: true }
  | { success: false; error: string };

export interface ApplePayButtonProps
  extends Omit<NativeProps, "supportedNetworks" | "onFinishWithResult"> {
  supportedNetworks?: ("visa" | "masterCard" | "amex" | "discover")[];
  onFinishWithResult?: (data: FinishWithResultEvent) => void;
}

// export type ButtonType =
//   | "plain"
//   | "book"
//   | "buy"
//   | "checkout"
//   | "order"
//   | "subscribe"
//   | "pay"
//   | "in_store"
//   | "donate"
//   | "reload"
//   | "add_money"
//   | "top_up"
//   | "rent"
//   | "support"
//   | "contribute"
//   | "tip"
//   | "continue";
// export type ButtonTheme = "automatic" | "white" | "white_outline" | "black";
// export type AuthMethod = "PAN_ONLY" | "CRYPTOGRAM_3DS";

// export type ApplePayButtonProps = Omit<Config, "supportedNetworks"> & {
//   supportedNetworks?: CardNetwork[];
//   transaction: Transaction;
//   onDidAuthorizePayment?: (data: ApplePayResponse) => void;
//   onDidFinishWithResult?: (data: { success: boolean; error?: string }) => void;
//   onPrepareTransaction?: (data: Transaction) => void;

//   // TODO: Add shipping callback methods.
// };

// export type { Config, Transaction, ApplePayResponse, CardNetwork };
