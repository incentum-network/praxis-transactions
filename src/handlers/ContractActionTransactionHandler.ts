import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { contractAction, ContractResult } from "@incentum/praxis-db";
import { ContractActionPayload } from "@incentum/praxis-interfaces";
import { ContractActionTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractActionTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return ContractActionTransaction
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
      const payload: ContractActionPayload = transaction.data.asset.payload;
      payload.action.transaction = transaction.id;
      const result: ContractResult = await contractAction(payload.action);
      transaction.data.fee = this.calculateFeeFromAction(result.action);
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply ContractActionTransaction failed: ${e.toString()}`
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg])
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractActionTransaction`);
  }

}
