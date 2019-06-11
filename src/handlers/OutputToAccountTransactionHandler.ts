import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { contractAction } from "@incentum/praxis-db";
import { createActionActionJson, OutputHashableJson, OutputToAccountPayload } from "@incentum/praxis-interfaces";
import { OutputToAccountTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class OutputToAccountTransactionHandler extends BaseTransactionHandler {

  public getConstructor(): Transactions.TransactionConstructor {
    return OutputToAccountTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    await super.bootstrap(connection, walletManager);
    this.instance = await this.findOrStartPraxisInstance(this.owner);
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: OutputToAccountPayload = transaction.data.asset.payload;
      const action = createActionActionJson(this.owner, this.instance.contract, BaseTransactionHandler.outputToAccountReducer)
      action.transaction = transaction.id;
      action.inputs = [payload.input];
      action.signatures = [payload.signature]
      await contractAction(action);
      const amount = this.getCoinAmount(payload.input.output);
      this.logger.debug(`${amount.toString()} added to balance for ${sender.address}`);
      sender.balance = sender.balance.plus(amount);
      await this.addUnusedOutputs(sender, transaction, `${amount.toString()} output tokens added to account`);  
    } catch (e) {
      console.log('outputToAccount failed', e.error)
      const msg = `apply OutputToAccount failed: ${e}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public getCoinAmount(output: OutputHashableJson): Utils.BigNumber {
    return new Utils.BigNumber(output.coins[0].amount)
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert AccountToOutputTransaction`);
  }

}
