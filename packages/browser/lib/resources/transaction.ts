import {
  TransactionDetailsWithDomain,
  CreateTransactionDetails,
  DisbursementTransactionDetails,
  RecurringTransactionDetails,
} from "types";

export class Transaction {
  details: TransactionDetailsWithDomain;

  constructor(
    details:
      | CreateTransactionDetails
      | RecurringTransactionDetails
      | DisbursementTransactionDetails
  ) {
    this.details = {
      ...details,
      type: details.type ?? "payment",
      domain: window.location.origin.replace(/https?:\/\//, ""),
    } as TransactionDetailsWithDomain;
  }
}
