import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { contractAction, rollbackLastAction } from "@incentum/praxis-db";
import { AccountToOutputPayload, ContractJson, ContractResult, createActionActionJson, hashJson, toContractJson } from "@incentum/praxis-interfaces";
import { AccountToOutputTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class AccountToOutputTransactionHandler extends BaseTransactionHandler {

  public getConstructor(): Transactions.TransactionConstructor {
    return AccountToOutputTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    await super.bootstrap(connection, walletManager);
    this.instance = await this.findOrStartPraxisInstance(this.owner);
    BaseTransactionHandler.accountOutputsMint = hashJson(this.instance.contract);
    this.logger.info(`accountToOutput contractKey: ${this.contractKey}`);
    this.logger.info(`accountToOutput mint: ${BaseTransactionHandler.accountOutputsMint}`);

    const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
    for (const transaction of transactions) {
      // TODO should check that transaction succeeded in praxis
      const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
      const payload: AccountToOutputPayload = transaction.asset.payload;
      this.logger.debug(`accountToOutput bootstrap before: ${sender.balance} ${payload.amount}`);
      if (sender.balance.isGreaterThanOrEqualTo(new Utils.BigNumber(payload.amount))) {
        sender.balance = sender.balance.minus(new Utils.BigNumber(payload.amount));
      }
      this.logger.debug(`accountToOutput bootstrap after: ${sender.balance} ${payload.amount}`);
    }

  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: AccountToOutputPayload = transaction.data.asset.payload;
      if (sender.balance.isGreaterThanOrEqualTo(new Utils.BigNumber(payload.amount))) {
        const action = createActionActionJson(this.owner, this.instance.contract, BaseTransactionHandler.accountToOutputReducer)
        action.transaction = transaction.id;
        action.form = {
          amount: payload.amount,
          sender: sender.address,
          title: 'PRAX tokens from wallet',
          subtitle: 'PRAX tokens moved from the Praxis wallet',
        }
        await contractAction(action);
        sender.balance = sender.balance.minus(new Utils.BigNumber(payload.amount));
        await this.addUnusedOutputs(sender, transaction, `${payload.amount} account tokens converted to output`);
      } else {
        this.showWalletErrors(sender, ['Not enough tokens to create output'], transaction)
      }
    } catch (e) {
      const msg = `apply AccountToOutputTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const payload: AccountToOutputPayload = transaction.data.asset.payload;
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    const contractHash = hashJson(toContractJson(this.instance.contract))
    await rollbackLastAction(contractHash)
    sender.balance = sender.balance.plus(new Utils.BigNumber(payload.amount));
    this.logger.info(`revert AccountToOutputTransaction`);
  }

}
