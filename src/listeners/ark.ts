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
      const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, options.networkVersion)
      if (itumAmount.isGreaterThanOrEqualTo(priceOpts.minPurchaseAmount) && itumAmount.isLessThanOrEqualTo(priceOpts.maxPurchaseAmount)) {
          const payload: CoinToOutputPayload = {
          coin: 'ARK',
          coinAmount,
          recipientId,
          itumAmount: itumAmount.toString(),
          coinPrice: arkPrice.toString(),
          itumPrice: priceOpts.itumPrice.toString(),
          to: transaction.recipient,
          publicKey: transaction.senderPublicKey,
          hash: transaction.id,
        }
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
