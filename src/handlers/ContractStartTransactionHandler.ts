import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { contractStart } from "@incentum/praxis-db";
import { ContractResult, ContractStartPayload } from "@incentum/praxis-interfaces";
import { ContractStartTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractStartTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return ContractStartTransaction
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
      const payload: ContractStartPayload = transaction.data.asset.payload;
      payload.action.transaction = transaction.id;
      const result: ContractResult = await contractStart(payload);
      transaction.data.fee = this.calculateFeeFromAction(result.action)
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply ContractStartTransaction failed: ${e.toString()}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractStartTransaction`);
  }

}
