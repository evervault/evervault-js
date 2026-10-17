import {
  TransactionDetailsWithDomain,
  CreateTransactionDetails,
  DisbursementTransactionDetails,
  RecurringTransactionDetails,
  DeferredTransactionDetails,
} from "types";
import { resolveTopLevelDomain } from "../utils";

export class Transaction {
  details: TransactionDetailsWithDomain;

  constructor(
    details:
      | CreateTransactionDetails
      | RecurringTransactionDetails
      | DisbursementTransactionDetails
      | DeferredTransactionDetails
  ) {
    this.details = {
      ...details,
      type: details.type ?? "payment",
      domain: resolveTopLevelDomain(),
    } as TransactionDetailsWithDomain;
  }
}
