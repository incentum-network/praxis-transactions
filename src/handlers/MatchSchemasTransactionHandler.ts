import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { matchSchemas } from "@incentum/praxis-db";
import { MatchSchemasPayload, MatchSchemasResult } from "@incentum/praxis-interfaces";
import { MatchSchemasTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class MatchSchemasTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return MatchSchemasTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    return
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async exists(payload: MatchSchemasPayload): Promise<boolean> {
    return false; // return await existsSchemas({ schemas: payload.schemas})
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: MatchSchemasPayload = transaction.data.asset.payload;
      const result: MatchSchemasResult = await matchSchemas(payload);
      this.addMatchSchemasToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply MatchSchemasTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert MatchSchemasTransaction`);
  }

}
