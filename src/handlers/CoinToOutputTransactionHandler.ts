import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { contractAction, rollbackLastAction } from "@incentum/praxis-db";
import { CoinToOutputPayload, createActionActionJson, hashJson, toContractJson } from "@incentum/praxis-interfaces";
import { getAuthorizedLedger } from '../plugin'
import { CoinToOutputTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';


export class CoinToOutputTransactionHandler extends BaseTransactionHandler {

  private authorizedSenderPublicKey: string;
  public getConstructor(): Transactions.TransactionConstructor {
    return CoinToOutputTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    await super.bootstrap(connection, walletManager);
    this.instance = await this.findOrStartPraxisInstance(this.owner);
    this.authorizedSenderPublicKey = Identities.PublicKey.fromPassphrase(getAuthorizedLedger().mnemonic)
    this.logger.info(`accountToOutput contractKey: ${this.contractKey}`);
    this.logger.info(`accountToOutput mint: ${BaseTransactionHandler.accountOutputsMint}`);
  }

  public canBeApplied(
    transaction: Interfaces.ITransaction,
    wallet: State.IWallet,
    databaseWalletManager: State.IWalletManager,
  ): boolean {
    return transaction.data.senderPublicKey === this.authorizedSenderPublicKey;
  }

  public verify(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): boolean {
    return transaction.data.senderPublicKey === this.authorizedSenderPublicKey && super.verify(transaction, walletManager);
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: CoinToOutputPayload = transaction.data.asset.payload;
      console.log('CoinToOutputTransaction: payload', payload)
      const action = createActionActionJson(this.owner, this.instance.contract, BaseTransactionHandler.coinToOutputReducer)
      action.transaction = transaction.id;
      const hash = payload.hash.slice(0, 16); // enough for collisions
      action.form = {
        hash,
        amount: payload.itumAmount,
        sender: Identities.Address.fromPublicKey(payload.publicKey),
        title: `ITUM tokens from ${payload.coin}`,
        subtitle: `ITUM tokens purchased from ${payload.coinAmount} ${payload.coin}`,
      }
      await contractAction(action);
      const itumDisplayAmount = new Utils.BigNumber(payload.itumAmount).shiftedBy(-8).toString()
      await this.addUnusedOutputs(sender, transaction, `${payload.coinAmount} ${payload.coin} tokens converted to ${itumDisplayAmount} `);  
    } catch (e) {
      const msg = `apply CoinToOutputTransaction failed: ${e})}`;
      this.logger.warn(msg);
      this.logger.warn(e);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const contractHash = hashJson(toContractJson(this.instance.contract))
    await rollbackLastAction(contractHash)
    this.logger.info(`revert CoinToOutputTransaction`);
  }

}
