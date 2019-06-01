import { Errors } from "@arkecosystem/core-transactions";

export class UnusedMethodError extends Errors.TransactionError {
  constructor(msg: string) {
      super(msg);
  }
}