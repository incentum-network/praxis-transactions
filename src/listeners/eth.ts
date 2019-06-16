import { Logger } from '@arkecosystem/core-interfaces';
import { Utils } from '@arkecosystem/crypto';
import { ILedger, txCoinToOutput } from '@incentum/praxis-client';
import { CoinToOutputPayload } from '@incentum/praxis-interfaces';
import ethTx from 'ethereumjs-tx';
import ethUtil from 'ethereumjs-util';
import Web3 from 'web3';
import { Transaction } from 'web3-core';
import { delayFunc, ethPrice, ethToItum, itumPrice, updatePrices } from './prices'

export interface IWeb3Options {
  ledger: ILedger
  endpoint: string
  delay: number
  logger: Logger.ILogger
  ethAddress: string
  ethStartingBlock: number
}

const processTransaction = async (t:Transaction, options: IWeb3Options): Promise<void> => {
  options.logger.debug(`processTransaction: ${t.value}`)
  const tx: ethTx.Transaction = toEthTransaction(t)
  const publicKey = tx.getSenderPublicKey().toString('hex')
  const payload: CoinToOutputPayload = {
    coin: 'ETH',
    coinPrice: ethPrice.toString(),
    itumPrice: itumPrice.toString(),
    coinAmount: `${t.value}`,
    itumAmount: ethToItum(`${t.value}`).toString(),
    to: t.to,
    publicKey,
    hash: t.hash,
  }
  console.log(`processTransaction payload`, payload)
  await txCoinToOutput(payload, options.ledger)
}

const toEthTransaction = (tx: Transaction): ethTx.Transaction => {
  const data = (tx as any).input
  return (new ethTx.Transaction({
    nonce: tx.nonce,
    gasPrice: ethUtil.bufferToHex(new ethUtil.BN(tx.gasPrice).toBuffer()),
    gasLimit: tx.gas,
    to: tx.to,
    value: ethUtil.bufferToHex(new ethUtil.BN(tx.value).toBuffer()),
    data,
    chainId: 1,
    r: tx.r,
    s: tx.s,
    v: tx.v,
  }));
}

export const ethListener = async (options: IWeb3Options): Promise<void> => {
  const web3 = new Web3(options.endpoint)
  const eth = web3.eth
  const logger = options.logger
  const address = options.ethAddress
  const delay = options.delay

  let lastBlock = options.ethStartingBlock
  const processTransactions = async () => {
    logger.debug(`starting process transactions: ${address}`)
    let i = 0
    const transactions: Transaction[] = []

    try {
      const currentBlock = await eth.getBlockNumber()
      logger.debug(`current ethereum block: ${currentBlock}`)
      for (i = currentBlock; i >= lastBlock; --i) {
        const block = await eth.getBlock(i, true)
        console.log('got block ', block.number)
        if (block && block.transactions) {
          block.transactions.forEach((t: Transaction) => {
            if (address === t.to) {
              console.log('eth transaction match to', t)
              if (t.to !== t.from) {
                transactions.push(t)
              }
            }
          })
        }
      }
      lastBlock = currentBlock

      await updatePrices()
      transactions.forEach(async (t) => {
        await processTransaction(t, options)
      })
    } catch (e) {
      options.logger.error(`Error processing ethereum block ${i}, ${e}`)
    }

    delayFunc(processTransactions, delay * 10)
  }

  console.log(`ethListener delay: ${delay}`)
  delayFunc(processTransactions, delay)
}
