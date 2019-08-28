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

import { 
  Database, 
  EventEmitter, 
  State 
} from "@arkecosystem/core-interfaces";
import { 
  Interfaces, 
  Transactions, 
  Utils 
} from "@arkecosystem/crypto";
import { 
  contractAction, 
  rollbackLastAction 
} from "@incentum/praxis-db";
import { 
  createActionActionJson, 
  hashJson, 
  OutputHashableJson, 
  OutputToAccountPayload, 
  toContractJson 
} from "@incentum/praxis-interfaces";
import { OutputToAccountTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler';

export class OutputToAccountTransactionHandler extends BaseTransactionHandler {

  public getConstructor(): Transactions.TransactionConstructor {
    return OutputToAccountTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    await super.bootstrap(connection, walletManager);
    this.instance = await this.findOrStartPraxisInstance(this.owner);
    this.logger.info(`outputToAccount contractKey: ${this.contractKey}`);
    this.logger.info(`outputToAccount mint: ${BaseTransactionHandler.accountOutputsMint}`);

    const transactions = await connection.transactionsRepository.getAssetsByType(this.getConstructor().type);
    for (const transaction of transactions) {
      // TODO should check that transaction succeeded in praxis
      const sender: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
      const payload: OutputToAccountPayload = transaction.asset.payload;
      const amount = this.getCoinAmount(payload.input.output);
      this.logger.debug(`outputToAccount bootstrap before: ${sender.balance} ${amount}`);
      sender.balance = sender.balance.plus(amount);
      this.logger.debug(`outputToAccount bootstrap after: ${sender.balance} ${amount}`);
    }

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
      await contractAction(action, transaction.timestamp);
      const amount = this.getCoinAmount(payload.input.output);
      this.logger.debug(`${amount.toString()} added to balance for ${sender.address}`);
      sender.balance = sender.balance.plus(amount);
      await this.addUnusedOutputs(sender, transaction, `${amount.toString()} output tokens added to account`);  
    } catch (e) {
      const msg = `apply OutputToAccount failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction);
    }
  }

  public getCoinAmount(output: OutputHashableJson): Utils.BigNumber {
    return new Utils.BigNumber(output.coins[0].amount)
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert OutputToAccountTransaction`);
    const payload: OutputToAccountPayload = transaction.data.asset.payload;
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    const contractHash = hashJson(toContractJson(this.instance.contract))
    await rollbackLastAction(contractHash)
    const amount = this.getCoinAmount(payload.input.output);
    sender.balance = sender.balance.minus(new Utils.BigNumber(amount));
  }
}
