import { Errors } from "@arkecosystem/core-transactions";

export class UnusedMethodError extends Errors.TransactionError {
  constructor(msg: string) {
      super(msg);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class TemplateMissingError extends Errors.TransactionError {
  constructor(msg: string) {
      super(msg);
  }
}

// tslint:disable-next-line:max-classes-per-file
export class FindOrStartInstanceError extends Errors.TransactionError {
  constructor(msg: string) {
      super(msg);
  }
}
