import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { getContractFromInstance } from "@incentum/praxis-db";
import { ContractResult, GetContractFromInstancePayload } from "@incentum/praxis-interfaces";
import { ContractFromInstanceTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractFromInstanceTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return ContractFromInstanceTransaction
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
      const payload: GetContractFromInstancePayload = transaction.data.asset.payload;
      const result: ContractResult = await getContractFromInstance(payload);
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      const msg = `apply ContractFromInstanceTransaction failed: ${e.error}`
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractFromInstanceTransaction`);
  }

}
