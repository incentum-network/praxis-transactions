import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";

export abstract class BaseTransaction extends Transactions.Transaction {
    // @ts-ignore
    protected logger = app.resolvePlugin<Logger.ILogger>("logger");
}
