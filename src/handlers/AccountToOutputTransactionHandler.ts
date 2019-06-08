import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { contractAction } from "@incentum/praxis-db";
import { AccountToOutputPayload, ContractJson, createActionActionJson } from "@incentum/praxis-interfaces";
import { AccountToOutputTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class AccountToOutputTransactionHandler extends BaseTransactionHandler {

  public reducer: string;
  public contract: ContractJson;
  public getConstructor(): Transactions.TransactionConstructor {
    return AccountToOutputTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    this.reducer = 'accountToOutput';
    this.contract = {} as ContractJson;
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: AccountToOutputPayload = transaction.data.asset.payload;
      if (sender.balance.isGreaterThanOrEqualTo(new Utils.BigNumber(payload.amount))) {
        const action = createActionActionJson(sender.address, this.contract, this.reducer)
        action.transaction = transaction.id;
        await contractAction(action);
        sender.balance = sender.balance.minus(new Utils.BigNumber(payload.amount));
        await this.addUnusedOutputs(sender, transaction, `${payload.amount} account tokens converted to output`);  
      } else {
        this.showWalletErrors(sender, ['Not enough tokens to create output'], transaction)
      }
    } catch (e) {
      const msg = `apply AccountToOutputTransaction failed: ${e.toString()}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert AccountToOutputTransaction`);
  }

}
