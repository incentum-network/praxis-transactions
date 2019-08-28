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

import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { saveSchemas } from "@incentum/praxis-db";
import { SaveSchemasPayload, SchemasJson } from "@incentum/praxis-interfaces";
import { SaveSchemasTransaction } from "../transactions";
import { BaseTransactionHandler } from './BaseTransactionHandler'

export class SaveSchemasTransactionHandler extends BaseTransactionHandler {
  public getConstructor(): Transactions.TransactionConstructor {
    return SaveSchemasTransaction
  }

  public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
    return
  }

  public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
      return
  }

  public async exists(payload: SaveSchemasPayload): Promise<boolean> {
    return false; // return await existsSchemas({ schemas: payload.schemas})
  }

  public async apply(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
    try {
      const payload: SaveSchemasPayload = transaction.data.asset.payload;
      if (await this.exists(payload)) {
        const msg = `apply SaveSchemasTransaction: Schemas already exists: ${payload.schemas.templateHash}`;
        this.logger.warn(msg);
        this.showWalletErrors(sender, [msg], transaction);
      } else {
        const result: SchemasJson = await saveSchemas(payload);
        this.showWalletOk(sender, ['Schemas saved'], transaction, result);
      }
    } catch (e) {
      const msg = `apply SaveSchemasTransaction failed: ${e.error}`;
      this.logger.warn(msg);
      this.showWalletErrors(sender, [msg], transaction)
    }
  }

  public async revert(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): Promise<void> {
    this.logger.info(`revert SaveSchemasTransaction`);
  }

}
