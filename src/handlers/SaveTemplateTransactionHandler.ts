import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { existsTemplate, saveTemplate } from "@incentum/praxis-db";
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

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async exists(payload: SaveTemplatePayload): Promise<boolean> {
    return await existsTemplate({ template: payload.template})
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: SaveTemplatePayload = transaction.data.asset.payload;
      if (await this.exists(payload)) {
        const msg = `apply SaveTemplateTransaction: Template already exists: ${payload.template.name}`;
        this.logger.warn(msg);
        this.showWalletErrors(sender, [msg], transaction);
      } else {
        const result: TemplateJson = await saveTemplate(payload);
        transaction.data.fee = this.calculateFeeFromTemplate(result);
        this.showWalletOk(sender, ['Save Template Successful'], transaction);
      }
    } catch (e) {
      const msg = `apply SaveTemplateTransaction failed: ${e.toString()}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert SaveTemplateTransaction`);
  }

}
