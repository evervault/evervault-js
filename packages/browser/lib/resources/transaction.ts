import { TransactionDetails } from "types";

export class Transaction {
  details: TransactionDetails;

  constructor(details: TransactionDetails) {
    this.details = details;
  }
}
