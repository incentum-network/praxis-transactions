import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { contractSearch } from "@incentum/praxis-db";
import { ContractSearchPayload, ContractSearchResult } from "@incentum/praxis-interfaces";
import { SearchTemplateTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class SearchTemplateTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return SearchTemplateTransaction
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
      const payload: ContractSearchPayload = transaction.data.asset.payload;
      const result: ContractSearchResult = await contractSearch(payload);
      this.addSearchTemplatesToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply SearchTemplateTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert SearchTemplateTransaction`);
  }

}
