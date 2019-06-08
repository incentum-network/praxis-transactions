import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { contractAction } from "@incentum/praxis-db";
import { ContractJson, createActionActionJson, inputFromOutput, OutputJson, OutputToAccountPayload } from "@incentum/praxis-interfaces";
import { OutputToAccountTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class OutputToAccountTransactionHandler extends BaseTransactionHandler {

  public reducer: string;
  public contract: ContractJson;
  public getConstructor(): Transactions.TransactionConstructor {
    return OutputToAccountTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    this.reducer = 'outputToAccount';
    this.contract = {} as ContractJson;
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: OutputToAccountPayload = transaction.data.asset.payload;
      const action = createActionActionJson(sender.address, this.contract, this.reducer)
      action.transaction = transaction.id;
      const input = inputFromOutput(payload.output);
      // TODO sign this input
      action.inputs = [input];
      await contractAction(action);
      const amount = this.getCoinAmount(payload.output);
      sender.balance = sender.balance.plus(amount);
      await this.addUnusedOutputs(sender, transaction, `${amount.toString()} output tokens added to account`);  
    } catch (e) {
      const msg = `apply AccountToOutputTransaction failed: ${e.toString()}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public getCoinAmount(output: OutputJson): Utils.BigNumber {
    return new Utils.BigNumber(0)
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert AccountToOutputTransaction`);
  }

}
