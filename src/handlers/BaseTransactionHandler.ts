import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { ContractResult, ContractSearchResult, getUnusedOutputs } from "@incentum/praxis-db";
import { ActionJson, hashJson, OutputJson, TemplateJson } from "@incentum/praxis-interfaces";
import { UnusedMethodError } from '../errors';

export interface IPraxisWallet {
  outputs: OutputJson[];
  instances: ContractResult[];
  messages: string[];
  templates: IWalletTemplate[];
}

export interface IWalletTemplate {
  template: TemplateJson;
  hash: string;
}

export abstract class BaseTransactionHandler extends Handlers.TransactionHandler {
  protected logger = app.resolvePlugin<Logger.ILogger>("logger");

  public getPraxisFromWallet(wallet): IPraxisWallet {
    return wallet.praxis || {
      outputs: [],
      instances: [],
      templates: [],
      messages: [],
    }
  }

  public async addInstanceToWallet(sender: State.IWallet, result: ContractResult, transaction: Interfaces.ITransaction): Promise<void> {
    const wallet = sender as any;
    const outputs = await getUnusedOutputs({ledger: sender.address});
    const praxisWallet = this.getPraxisFromWallet(wallet);
    wallet.praxis = {
      ...praxisWallet,
      outputs,
      instances: (praxisWallet.instances || []).concat([result]),
      messages: ['Contract instance updated'],
    }
  }

  public addTemplateToWallet(sender: State.IWallet, result: TemplateJson, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet);
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Template saved: ${result.name}`],
      templates: [result].map((template) => ({ template, hash: hashJson(template)})),
    }
  }

  public addTemplatesToWallet(sender: State.IWallet, result: ContractSearchResult, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet);
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Template search: ${result.templates.length} results`],
      templates: result.templates.map((template) => ({ template, hash: hashJson(template)})),
    }
  }

  public showWalletErrors(sender: State.IWallet, messages: string[]): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet);
    wallet.praxis = {
      ...praxisWallet,
      messages,
    }
  }

  public async addUnusedOutputs(sender: State.IWallet): Promise<void> {
    const wallet = sender as any;
    const outputs = await getUnusedOutputs({ledger: sender.address});
    const praxisWallet = this.getPraxisFromWallet(wallet);
    wallet.praxis = {
      ...praxisWallet,
      outputs,
      messages: ['Unused outputs updated'],
    }
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
    return transaction.verify();
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

  public calculateFeeFromTemplate(action: TemplateJson): Utils.BigNumber {
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
