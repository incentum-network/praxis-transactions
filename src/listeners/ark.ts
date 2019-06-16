import { Logger } from "@arkecosystem/core-interfaces";
import { ILedger } from "@incentum/praxis-client";

export interface IArkOptions {
  ledger: ILedger
  logger: Logger.ILogger
}

export const arkListener = async (options: IArkOptions): Promise<void> => {
  return
}