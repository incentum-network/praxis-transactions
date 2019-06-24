import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { instanceSearch } from "@incentum/praxis-db";
import { ContractResult, InstanceSearchPayload } from "@incentum/praxis-interfaces";
import { SearchInstanceTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class SearchInstanceTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return SearchInstanceTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    return
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: InstanceSearchPayload = transaction.data.asset.payload;
      const result: ContractResult[] = await instanceSearch(payload);
      this.addSearchInstancesToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply SearchInstanceTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert SearchInstanceTransaction`);
  }

}
