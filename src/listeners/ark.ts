import { Logger } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
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
  console.log('getTransactionsForRecipient', post)
  try {
    const response = await axios.post(url, post)
    console.log('getTransactionsForRecipient', response.data)
    return response.data.data
  } catch (e) {
    console.log('ark failed', e)
    return []
  }
} 

export const arkListener = async (options: IArkOptions): Promise<void> => {
  const logger = options.logger

  let from = 0
  const processTransactions = async () => {
    logger.debug(`starting process transactions for ark: ${options.address}`)

    const processTransaction = async (transaction: IArkTransaction, options: IArkOptions) => {
      options.logger.debug(`processTransaction: ${transaction.id}`)
  
      const payload: CoinToOutputPayload = {
        coin: 'ARK',
        coinPrice: arkPrice.toString(),
        itumPrice: priceOpts.itumPrice.toString(),
        coinAmount: new Utils.BigNumber(`${transaction.amount}`).shiftedBy(-8).toString(),
        itumAmount: arkToItum(`${transaction.amount}`).toString(),
        to: transaction.recipient,
        publicKey: transaction.senderPublicKey,
        hash: transaction.id,
      }
      await txCoinToOutput(payload, options.ledger)  
    }
  
    try {
      await updatePrices()
      const transactions = await getTransactionsForRecipient(options.endpoint, options.address, from)
      transactions.forEach(async (t) => {
        await processTransaction(t, options)
        // TODO need to set from right here, seconds since start of blockchain?
        // from = t.timestamp.epoch - 1
        from = 0
      })
    } catch (e) {
      console.log('error in ark transactions', e)
      options.logger.error(`Error processing ark transactions, ${e}`)
    }
    delayFunc(processTransactions, 60000 * 1)
  }
  console.log(`arkListener delay: ${options.delay}`)
  delayFunc(processTransactions, options.delay)
}
