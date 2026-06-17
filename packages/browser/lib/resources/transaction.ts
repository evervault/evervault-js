import {
  TransactionDetailsWithDomain,
  CreateTransactionDetails,
  DisbursementTransactionDetails,
  RecurringTransactionDetails,
} from "types";
import { resolveTopLevelDomain } from "../utils";

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
      domain: resolveTopLevelDomain(),
    } as TransactionDetailsWithDomain;
  }
}
