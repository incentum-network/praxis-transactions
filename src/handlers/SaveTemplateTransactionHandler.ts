import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { SaveTemplatePayload, TemplateJson } from "@incentum/praxis-interfaces";
import { SaveTemplateTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class SaveTemplateTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return SaveTemplateTransaction
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
    this.logger.info(`apply SaveTemplateTransaction`);
    try {
      const payload: SaveTemplatePayload = transaction.data.asset.payload;
      const result: TemplateJson = payload.template; // await saveTemplate(payload);
      transaction.data.fee = this.calculateFeeFromTemplate(result);
      const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
      this.addTemplateToWallet(sender, result, transaction);
    } catch (e) {
      throw e;
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert SaveTemplateTransaction`);
  }

}
