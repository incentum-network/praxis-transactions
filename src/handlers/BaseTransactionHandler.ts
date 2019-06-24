import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, Logger, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, } from "@arkecosystem/core-transactions";
import { Interfaces, Utils } from "@arkecosystem/crypto";
import { IPraxisWallet, ITransactionResult } from "@incentum/praxis-client";
import { hashContractKey } from '@incentum/praxis-contracts';
import { 
  contractSearch,
  contractStart,
  getUnusedOutputs, 
  instanceSearch,
  saveTemplate,
} from "@incentum/praxis-db";
import { 
  ActionJson, 
  CoinJson, 
  ContractResult, 
  ContractSearchResult, 
  createStartActionJson, 
  hashJson, 
  HashKeyString, 
  MatchSchemasResult, 
  SchemasJson,
  TemplateJson
} from "@incentum/praxis-interfaces";
import { FindOrStartInstanceError, TemplateMissingError, UnusedMethodError } from '../errors';

const  transactionOk = (transaction: Interfaces.ITransaction, result: any): ITransactionResult => {
  return { status: 0, id: transaction.id, messages: ['ok'], result };
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

const startReducer = `
(
  $newState := {
    'owner': $action.ledger,
    'hashes': {},
    'total': $x.coin.new(0, $form.symbol, $form.decimals)
  };
  $x.result($newState)
)
`

const accountToOutputReducer = `
(
  $x.assert.equal($action.ledger, $state.owner, 'invalid owner');
  $minted := $x.mint($form.sender, $state.total.symbol, $form.amount, $state.total.decimals, $form.title, $form.subtitle, '', $action.tags);
  $total := $x.plus($state.total.amount, $form.amount);
  $coin := $merge([$state.total, { 'amount': $total}]);
  $newState := $merge([$state, { 'total': $coin}]);
  $x.result($newState, [], [$minted])
)
`

const coinToOutputReducer = `
(
  $x.assert.equal($action.ledger, $state.owner, 'invalid owner');
  $exists := $lookup($state.hashes, $form.hash);
  $x.assert.isNotOk($exists, 'hash already exists');
  $hashes := $merge([$state.hashes, { $form.hash: true }]);
  $minted := $x.mint($form.sender, $state.total.symbol, $form.amount, $state.total.decimals, $form.title, $form.subtitle, '', $action.tags);
  $total := $x.plus($state.total.amount, $form.amount);
  $coin := $merge([$state.total, { 'amount': $total}]);
  $newState := $merge([$state, { 'total': $coin}, { 'hashes': $hashes }]);
  $x.result($newState, [], [$minted])
)
`

const outputToAccountReducer = `
(
  $x.assert.equal($action.ledger, $state.owner, 'invalid owner');
  $x.assert.equal($count($inputs), 1, 'only one input allowed');
  $input := $inputs[0];
  $output := $input.output;
  $x.assert.equal($count($output.coins), 1, 'only one coin allowed');
  $coin := $output.coins[0];
  $x.assert.isTrue($x.coin.same($coin, $state.total), 'coin mismatch');
  $total := $x.minus($state.total.amount, $coin.amount);
  $x.assert.isTrue($x.notNegative($total), 'total is negative');
  $coin := $merge([$state.total, { 'amount': $total}]);
  $newState := $merge([$state, { 'total': $coin}]);
  $x.result($newState)
)
`

const accountOutputsTemplateName = 'AccountOutputs'
const accountOutputsContractKey = `token/PRAX/0`;
const accountOutputsTemplate = (ledger: string): TemplateJson => {
  return {
    ledger,
    name: accountOutputsTemplateName,
    versionMajor: 1,
    versionMinor: 0,
    versionPatch: 0,
    description: 'Coins to Outputs',
    other: {},
    tags: [],
    reducers: [
      {
        type: 'start',
        language: 'jsonata',
        code: startReducer,
      },
      {
        type: 'accountToOutput',
        language: 'jsonata',
        code: accountToOutputReducer,
      },
      {
        type: 'coinToOutput',
        language: 'jsonata',
        code: coinToOutputReducer,
      },
      {
        type: 'outputToAccount',
        language: 'jsonata',
        code: outputToAccountReducer,
      },
    ],
  };

};

const MAX_TRANSACTIONS = 20;
const MAX_INSTANCES = 50;
const MAX_SCHEMAS = 20;
export abstract class BaseTransactionHandler extends Handlers.TransactionHandler {
  protected static accountOutputsTemplate = accountOutputsTemplateName;
  protected static accountOutputsMint = "";
  protected static praxSymbol = "PRAX";
  protected static praxDecimals = 8;
  protected static coinToOutputReducer = "coinToOutput";
  protected static accountToOutputReducer = "accountToOutput";
  protected static outputToAccountReducer = "outputToAccount";

  protected contractKey: HashKeyString;
  protected instance: ContractResult;
  protected logger = app.resolvePlugin<Logger.ILogger>("logger");
  protected owner: string;
  protected templateOwner: string;

  public praxis(): IPraxisWallet {
    return {
      outputs: [],
      instances: [],
      schemas: [],
      messages: [],
      lastTransactions: [],
      templateSearch: [],
      instanceSearch: [],
      username: '',
      balance: '',
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
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction, result));
    wallet.praxis = {
      ...praxisWallet,
      outputs: outputs.outputs,
      instances: addInstances(praxisWallet, [result]),
      messages: ['Contract instance updated'],
    }
  }

  public addSearchTemplatesToWallet(sender: State.IWallet, templateSearch: ContractSearchResult, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction, {}));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Template search: ${templateSearch.templates.length} results`],
      templateSearch: templateSearch.templates.map((template) => ({ template, hash: hashJson(template)})),
    }
  }

  public addSearchInstancesToWallet(sender: State.IWallet, instanceSearch: ContractResult[], transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction, {}));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Instance search: ${instanceSearch.length} results`],
      instanceSearch,
    }
  }

  public addMatchSchemasToWallet(sender: State.IWallet, result: MatchSchemasResult, transaction: Interfaces.ITransaction): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction, result));
    wallet.praxis = {
      ...praxisWallet,
      messages: [`Schemas added`],
      schemas: addSchemas(praxisWallet, result.schemas),
    }
  }

  public showWalletOk(sender: State.IWallet, messages: string[], transaction: Interfaces.ITransaction, result: any): void {
    const wallet = sender as any;
    const praxisWallet = this.getPraxisFromWallet(wallet, { status: 0, id: transaction.id, messages, result});
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

  public isPraxisCoin(coin: CoinJson): boolean {
    return coin.symbol === BaseTransactionHandler.praxSymbol 
      && coin.mint === BaseTransactionHandler.accountOutputsMint
      && coin.decimals === BaseTransactionHandler.praxDecimals;
  }

  public async addUnusedOutputs(sender: State.IWallet, transaction: Interfaces.ITransaction, msg: string = 'Unused outputs updated'): Promise<void> {
    const wallet = sender as any;
    const outputs = await getUnusedOutputs({ledger: sender.address});
    const praxisWallet = this.getPraxisFromWallet(wallet, transactionOk(transaction, {}));
    wallet.praxis = {
      ...praxisWallet,
      outputs: outputs.outputs.map((o) => {
        if (o.coins.length === 1 && this.isPraxisCoin(o.coins[0])) {
          (o as any).isPraxisOutput = true;
        }
        return o;
      }),
      messages: [msg],
    }
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    this.owner = 'DBAgvThPiCKBpBCCFBHQaGwRkevSXbBGFp';
    this.templateOwner = this.owner;
  }

  public async findOrStartPraxisInstance(address: string): Promise<ContractResult> {
    this.contractKey = hashContractKey(this.owner, accountOutputsContractKey);
    this.logger.info(`contractKey: ${this.contractKey}`);
    this.logger.info(`Starting template instance, ${accountOutputsTemplateName}, key: ${this.contractKey}`);
    try {
      const instances = await instanceSearch({ ledger: '', search: this.contractKey});
      this.logger.info(`Instances, ${instances.length}, initializing`);
      const accountOutputs = instances.filter((i) => i.contract.key ===  this.contractKey);
      if (accountOutputs.length > 0) {
        this.logger.info(`Template instance found, ${accountOutputsTemplateName}`);
        return accountOutputs[0];
      } else {
        return await this.startInstance();
      }
    } catch (e) {
      console.log('FindOrStartInstanceError', e)
      throw new FindOrStartInstanceError(e.toString())
    }
  }

  public async saveAccountOutputTemplate() {
    this.logger.info(`Template not found, ${accountOutputsTemplateName}, saving`);
    return await saveTemplate({ template: accountOutputsTemplate(this.templateOwner)})
  }

  public async startInstance() {
    this.logger.info(`Contract instance not found, ${accountOutputsTemplateName}, initializing`);
    const templates = await contractSearch({search: accountOutputsTemplateName});
    let template = templates.templates.find((t) => t.ledger === this.templateOwner);
    if (!template) { template = await this.saveAccountOutputTemplate(); }
    this.logger.info(`Found template ${accountOutputsTemplateName}, starting instance`);
    const action = createStartActionJson(this.owner, template);
    action.transaction = this.contractKey;
    action.form = {
      'symbol': BaseTransactionHandler.praxSymbol,
      'decimals': BaseTransactionHandler.praxDecimals,
    }
    this.logger.info(`Instance for template ${accountOutputsTemplateName}, started`);
    return await contractStart({ action, initialState: {}, key: accountOutputsContractKey});
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
    // throw new UnusedMethodError('applyToSenderInPool should not get called in Praxis BaseTransactionHandler')
  }

  public revertForSenderInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // throw new UnusedMethodError('revertForToSenderInPool should not get called in Praxis BaseTransactionHandler')
  }

  public applyToRecipientInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // throw new UnusedMethodError('applyToRecipientInPool should not get called in Praxis BaseTransactionHandler')
  }

  public revertForRecipientInPool(transaction: any, poolWalletManager: State.IWalletManager): void {
    // throw new UnusedMethodError('revertForRecipientInPool should not get called in Praxis BaseTransactionHandler')
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
