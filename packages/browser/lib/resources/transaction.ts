import { TransactionDetails, CreateTransactionDetails, DisbursementTransactionDetails } from "types";

export class Transaction {
  details: TransactionDetails;

  constructor(details: CreateTransactionDetails | DisbursementTransactionDetails) {
    this.details = {
      ...details,
      type: details.type ?? 'payment'
    } as TransactionDetails;
  }

}