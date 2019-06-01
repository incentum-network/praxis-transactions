import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { ActionJson } from "@incentum/praxis-interfaces";
import { UnusedMethodError } from '../errors';

export abstract class BaseTransactionHandler extends Handlers.TransactionHandler {
  protected logger = app.resolvePlugin<Logger.ILogger>("logger");

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

  public calculateFeeFromAction(action: ActionJson): Utils.BigNumber {
    return new Utils.BigNumber(500000000);
  }

  public applyToSenderInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // ignore
  }

  public revertForSenderInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // ignore
  }

  public applyToRecipientInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // ignore
  }

  public revertForRecipientInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // ignore
  }

  protected applyToSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
    throw new UnusedMethodError('applyToSender should not get called in Praxis BaseTransactionHandler')
  }

  protected revertForSender(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
    throw new UnusedMethodError('revertForSender should not get called in Praxis BaseTransactionHandler')
  }

  protected applyToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
    throw new UnusedMethodError('applyToRecipient should not get called in Praxis BaseTransactionHandler')
  }

  protected revertForRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
    throw new UnusedMethodError('revertForRecipiend should not get called in Praxis BaseTransactionHandler')
  }

}
