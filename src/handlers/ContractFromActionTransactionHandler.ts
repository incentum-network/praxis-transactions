import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { getContractFromAction } from "@incentum/praxis-db";
import { ContractResult, GetContractFromActionPayload } from "@incentum/praxis-interfaces";
import { ContractFromActionTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractFromActionTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return ContractFromActionTransaction
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
      const payload: GetContractFromActionPayload = transaction.data.asset.payload;
      const result: ContractResult = await getContractFromAction(payload);
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply ContractFromActionTransaction failed: ${e.error}`
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractFromActionTransaction`);
  }

}
