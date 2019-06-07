import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { getUnusedOutputs } from "@incentum/praxis-db";
import { ActionJson, ContractResult, ContractSearchResult, hashJson, MatchSchemasResult, OutputJson, SchemasJson, TemplateJson } from "@incentum/praxis-interfaces";
import { UnusedMethodError } from '../errors';

export interface ITransactionResult {
  id: string;
  status: number;
  messages: string[];
}

export interface IPraxisWallet {
  outputs: OutputJson[];
  instances: ContractResult[];
  messages: string[];
  schemas: SchemasJson[];
  templateSearch: IWalletTemplate[];
  instanceSearch: ContractResult[];
  lastTransactions: ITransactionResult[];
}

export interface IWalletTemplate {
  template: TemplateJson;
  hash: string;
}

const  transactionOk = (transaction: Interfaces.ITransaction): ITransactionResult => {
  return { status: 0, id: transaction.id, messages: ['ok'] };
}

const addInstances = (praxis: IPraxisWallet, results: ContractResult[]) => {
  const instances = praxis.instances.slice(0)
  for (const result of results) {
    instances.unshift(result)
  }
  return instances.slice(0, MAX_INSTANCES)
}

const addSchemas = (praxis: IPraxisWallet, result: SchemasJson[]) => {
  const schemas = praxis.schemas.slice(0)
  schemas.unshift(result[0])
  return schemas.slice(0, MAX_SCHEMAS)
}

const MAX_TRANSACTIONS = 20;
const MAX_INSTANCES = 50;
const MAX_SCHEMAS = 20;
export abstract class BaseTransactionHandler extends Handlers.TransactionHandler {
  protected logger = app.resolvePlugin<Logger.ILogger>("logger");

  public praxis(): IPraxisWallet {
    return {
      outputs: [],
      instances: [],
      schemas: [],
      messages: [],
      lastTransactions: [],
      templateSearch: [],
      instanceSearch: [],
    };
  }

  public getPraxisFromWallet(wallet, result: ITransactionResult): IPraxisWallet {
    const praxis: IPraxisWallet = wallet.praxis || this.praxis();
    let lastTransactions = praxis.lastTransactions.slice(0)
    lastTransactions.unshift(result)
    lastTransactions = lastTransactions.slice(0, MAX_TRANSACTIONS)
    return {
      ...praxis,
      lastTransactions,
    }
  }

  public async addInstanceToWallet(sender: State.IWallet, result: ContractResult, transaction: Interfaces.ITransaction): Promise<void> {
    const wallet = sender as any;
    const outputs = await getUnusedOutputs({ledger: sender.address});
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction));
    wallet.praxis = {
      ...praxisWallet,
      outputs,
      instances: addInstances(praxisWallet, [result]),
      messages: ['Contract instance updated'],
    }
  }

  public addSearchTemplatesToWallet(sender: State.IWallet, templateSearch: ContractSearchResult, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Template search: ${templateSearch.templates.length} results`],
      templateSearch: templateSearch.templates.map((template) => ({ template, hash: hashJson(template)})),
    }
  }

  public addSearchInstancesToWallet(sender: State.IWallet, instanceSearch: ContractResult[], transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Instance search: ${instanceSearch.length} results`],
      instanceSearch,
    }
  }

  public addMatchSchemasToWallet(sender: State.IWallet, result: MatchSchemasResult, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Schemas added`],
      schemas: addSchemas(praxisWallet, result.schemas),
    }
  }

  public showWalletOk(sender: State.IWallet, messages: string[], transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, { status: 0, id: transaction.id, messages});
    wallet.praxis = {
      ...praxisWallet,
      messages,
    }
  }

  public showWalletErrors(sender: State.IWallet, messages: string[], transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, { status: 1, id: transaction.id, messages});
    wallet.praxis = {
      ...praxisWallet,
      messages,
    }
  }

  public async addUnusedOutputs(sender: State.IWallet, transaction: Interfaces.ITransaction): Promise<void> {
    const wallet = sender as any;
    const outputs = await getUnusedOutputs({ledger: sender.address});
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction));
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
