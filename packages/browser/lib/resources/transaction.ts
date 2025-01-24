import {
  TransactionDetailsWithDomain,
  CreateTransactionDetails,
  DisbursementTransactionDetails,
} from "types";

export class Transaction {
  details: TransactionDetailsWithDomain;

  constructor(
    details: CreateTransactionDetails | DisbursementTransactionDetails
  ) {
    this.details = {
      ...details,
      type: details.type ?? "payment",
      domain: window.location.origin.replace(/https?:\/\//, ""),
    } as TransactionDetailsWithDomain;
  }
}
