/*
 * Licensed to Incentum Ltd. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Incentum Ltd. licenses this file to you under
 * the Token Use License Version 1.0 and the Token Use
 * Clause (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of
 * the License at
 *
 *  https://github.com/incentum-network/tul/blob/master/LICENSE.md
 *  https://github.com/incentum-network/tul/blob/master/TUC.md
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Database, EventEmitter, State } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { CoinToOutputPayload } from "@incentum/praxis-interfaces";
import { authorizedSenderPublicKey } from '../plugin'
import { CoinToOutputTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class CoinToOutputTransactionHandler extends BaseTransactionHandler {

  private authorizedSenderPublicKey: string;
  private hashes: Map<string, number> = new Map<string, number>()
  public getConstructor(): Transactions.TransactionConstructor {
    return CoinToOutputTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    await super.bootstrap(connection, walletManager);
    this.authorizedSenderPublicKey = authorizedSenderPublicKey
    this.instance = await this.findOrStartPraxisInstance(this.owner);
    this.logger.info(`coinToOutput authorizedSenderPublicKey: ${this.authorizedSenderPublicKey}`);
    this.logger.info(`coinToOutput contractKey: ${this.contractKey}`);
    this.logger.info(`coinToOutput mint: ${BaseTransactionHandler.accountOutputsMint}`);

    const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
    for (const transaction of transactions) {
      // TODO should check that transaction succeeded in praxis
      const payload: CoinToOutputPayload = transaction.asset.payload;
      if (this.hashes.has(payload.hash)) {
        const count = this.hashes.get(payload.hash)
        this.hashes.set(payload.hash, count + 1)
        continue 
      }
      this.hashes.set(payload.hash, 1)
      const praxAmount = new Utils.BigNumber(payload.itumAmount)
      const purchaser: State.IWallet = walletManager.findByPublicKey(payload.publicKey)
      const praxWallet: State.IWallet = walletManager.findByAddress(BaseTransactionHandler.arkWalletAddress)
      this.logger.debug(`coinToOutput bootstrap before ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
      purchaser.balance = purchaser.balance.plus(praxAmount)
      praxWallet.balance = praxWallet.balance.minus(praxAmount)
      this.logger.debug(`coinToOutput bootstrap after ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
    }

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
      const praxAmount = new Utils.BigNumber(payload.itumAmount)
      const purchaser: State.IWallet = walletManager.findByPublicKey(payload.publicKey)
      const praxWallet: State.IWallet = walletManager.findByAddress(BaseTransactionHandler.arkWalletAddress)
      if (this.hashes.has(payload.hash)) {
        // This can happen if listener resends from the beginning, so just ignore
        // but still need to count it for revert
        const count = this.hashes.get(payload.hash)
        this.hashes.set(payload.hash, count + 1)
        this.logger.debug(`coinToOutput replayed ${payload.hash} purchaser: ${purchaser.address} ${purchaser.balance}`)
      } else {
        this.hashes.set(payload.hash, 1)
        this.logger.debug(`coinToOutput before ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
        purchaser.balance = purchaser.balance.plus(praxAmount)
        praxWallet.balance = praxWallet.balance.minus(praxAmount)
        this.logger.debug(`coinToOutput after ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
      }
    } catch (e) {
      const msg = `apply CoinToOutputTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.logger.warn(e);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert CoinToOutputTransaction`);
    const payload: CoinToOutputPayload = transaction.data.asset.payload;
    if (this.hashes.has(payload.hash)) {
      const count = this.hashes.get(payload.hash)
      if (count === 1) {
        this.hashes.delete(payload.hash)
        const praxAmount = new Utils.BigNumber(payload.itumAmount)
        const purchaser: State.IWallet = walletManager.findByPublicKey(payload.publicKey)
        const praxWallet: State.IWallet = walletManager.findByAddress(BaseTransactionHandler.arkWalletAddress)
        this.logger.debug(`coinToOutput revert before ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
        purchaser.balance = purchaser.balance.minus(praxAmount)
        praxWallet.balance = praxWallet.balance.plus(praxAmount)
        this.logger.debug(`coinToOutput revert after ${purchaser.address} balance: ${purchaser.balance}, ${praxWallet.address} balance: ${praxWallet.balance}`)
      } else {
        this.hashes.set(payload.hash, count - 1)
      }
    }
  }

}
