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

import { Logger } from "@arkecosystem/core-interfaces";
import { Identities, Utils } from "@arkecosystem/crypto";
import { ILedger, txCoinToOutput } from "@incentum/praxis-client";
import { CoinToOutputPayload } from "@incentum/praxis-interfaces";
import axios from 'axios';
import { arkPrice, arkToItum, delayFunc, priceOpts, updatePrices } from "./prices";

export interface IArkOptions {
  ledger: ILedger
  logger: Logger.ILogger
  address: string
  delay: number
  endpoint: string
  networkVersion: number
}

const searchUrl = (endpoint) => `${endpoint}/api/v2/transactions/search`

interface IArkTransaction {
  id: string
  blockId: string
  version: number
  type: number
  amount: number
  fee: number
  sender: string
  recipient: string
  signature: string
  vendorField: string
  confirmations: number
  senderPublicKey: string
  timestamp: {
    epoch: number
    unix: number
    human: string
  }

}

const ARK_TRANSFER_TYPE = 0
const getTransactionsForRecipient = async (endpoint: string, recipientId: string, from: number): Promise<IArkTransaction[]> => {
  const url = searchUrl(endpoint)
  const post = {
    recipientId,
    type: ARK_TRANSFER_TYPE,
    timestamp: {
      from,
    }
  }
  try {
    const response = await axios.post(url, post)
    return response.data.data
  } catch (e) {
    console.log('ark failed', e)
    return []
  }
}

export const delay = time => new Promise(resolve => setTimeout(resolve, time))

export const arkListener = async (options: IArkOptions): Promise<void> => {
  const logger = options.logger

  let from = 0
  const processTransactions = async () => {
    logger.debug(`starting process transactions for ark: ${options.address}`)

    const processTransaction = async (transaction: IArkTransaction, options: IArkOptions) => {
      options.logger.debug(`processTransaction: ${transaction.id}`)
      const coinAmount = new Utils.BigNumber(`${transaction.amount}`).shiftedBy(-8).toString()
      const itumAmount = arkToItum(`${transaction.amount}`)
      // const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, options.networkVersion)
      if (itumAmount.isGreaterThanOrEqualTo(priceOpts.minPurchaseAmount) && itumAmount.isLessThanOrEqualTo(priceOpts.maxPurchaseAmount)) {
          const payload: CoinToOutputPayload = {
          coin: 'ARK',
          coinAmount,
          // recipientId,
          itumAmount: itumAmount.toString(),
          coinPrice: arkPrice.toString(),
          itumPrice: priceOpts.itumPrice.toString(),
          to: transaction.recipient,
          publicKey: transaction.senderPublicKey,
          hash: transaction.id,
        }
        console.log('sending txCoinToOutput', payload)
        // Don't care about response, but sleep 1 second
        txCoinToOutput(payload, options.ledger)
        await delay(1000)
      } else {
        logger.warn(`Ark purchase out of bounds, ${itumAmount.shiftedBy(-8)}, must be >= ${priceOpts.minPurchaseAmount.shiftedBy(-8)} and <= ${priceOpts.maxPurchaseAmount.shiftedBy(-8)}`)
      }
    }
  
    try {
      await updatePrices()
      const transactions = await getTransactionsForRecipient(options.endpoint, options.address, from)
      for (const t of transactions) {
        await processTransaction(t, options)
        // TODO need to set from right here, seconds since start of blockchain?
        from = t.timestamp.epoch
      }
    } catch (e) {
      console.log('error in ark transactions', e)
      options.logger.error(`Error processing ark transactions, ${e}`)
    }
    delayFunc(processTransactions, 60000 * 1)
  }
  delayFunc(processTransactions, options.delay)
}
