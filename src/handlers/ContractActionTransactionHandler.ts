import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { ContractResult } from "@incentum/praxis-db";
import { ActionJson, ContractActionPayload, ContractJson, TemplateJson } from "@incentum/praxis-interfaces";
import { ContractActionTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class ContractActionTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return ContractActionTransaction
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
    this.logger.info(`apply ContractActionTransaction`);
    try {
      const payload: ContractActionPayload = transaction.data.asset.payload;
      payload.action.transaction = transaction.id;
      const result: ContractResult = { action: {} as ActionJson, template: {} as TemplateJson, contract: {} as ContractJson }; // await contractAction(payload.action);
      transaction.data.fee = this.calculateFeeFromAction(result.action);
      const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
      await this.addInstanceToWallet(sender, result, transaction);
    } catch (e) {
      throw e;
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert ContractActionTransaction`);
  }

}
