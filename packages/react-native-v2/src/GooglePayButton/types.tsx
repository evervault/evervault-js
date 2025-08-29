import { Config, Transaction } from "../specs/GooglePayButtonNativeComponent";

export type GooglePayButtonProps = Config & {
    transaction: Transaction;
};
