import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { ContractResult } from "@incentum/praxis-db";
import { ActionJson, ContractJson, ContractStartPayload, TemplateJson } from "@incentum/praxis-interfaces";
import { ContractStartTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractStartTransactionHandler extends BaseTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
      return ContractStartTransaction
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
      return
    }

    public canBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        databaseWalletManager: State.IWalletManager,
    ): boolean {
      return true;
    }

    public verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): boolean {
      return true;
      /*
      const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
      this.logger.info(`senderWallet.multiSignature ${senderWallet.multisignature}`);

      if (senderWallet.multisignature) {
        transaction.isVerified = senderWallet.verifySignatures(transaction.data);
      } else {
        transaction.isVerified = true;
      }

      return transaction.isVerified;
      */
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public canEnterTransactionPool(
      data: Interfaces.ITransactionData,
      pool: TransactionPool.IConnection,
      processor: TransactionPool.IProcessor,
  ): boolean {
    return true
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`apply ContractStartTransaction`);
    try {
      const payload: ContractStartPayload = transaction.data.asset.payload;
      payload.action.transaction = transaction.id;
      const result: ContractResult = { action: {} as ActionJson, template: {} as TemplateJson, contract: {} as ContractJson }; // await contractStart(payload);
      transaction.data.fee = this.calculateFeeFromAction(result.action)
      const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      throw e;
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractStartTransaction`);
  }

}
