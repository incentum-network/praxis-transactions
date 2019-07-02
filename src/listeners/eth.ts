import { Logger } from '@arkecosystem/core-interfaces';
import { Utils } from '@arkecosystem/crypto';
import { ILedger, txCoinToOutput } from '@incentum/praxis-client';
import { CoinToOutputPayload } from '@incentum/praxis-interfaces';
import EthTransaction from 'ethereumjs-tx';
import { BN, bufferToHex } from 'ethereumjs-util';
import secp256k1 from 'secp256k1';
import Web3 from 'web3';
import { Transaction } from 'web3-core';
import * as Web3Utils from 'web3-utils'
import { delayFunc, ethPrice, ethToItum, priceOpts, updatePrices } from './prices'


export interface IWeb3Options {
  ledger: ILedger
  endpoint: string
  delay: number
  logger: Logger.ILogger
  ethAddress: string
  ethStartingBlock: number
}

const processTransaction = async (t:Transaction, options: IWeb3Options): Promise<void> => {
  options.logger.debug(`processTransaction: ${t.hash}`)
  const tx: EthTransaction = toEthTransaction(t)
  const uc = new Uint8Array([0x04])
  const rawPublicKey = Buffer.concat([uc, tx.getSenderPublicKey()])
  const compressed = secp256k1.publicKeyConvert(rawPublicKey, true)
  const publicKey = compressed.toString('hex')
  const payload: CoinToOutputPayload = {
    coin: 'ETH',
    // recipientId: '',
    coinPrice: ethPrice.toString(),
    itumPrice: priceOpts.itumPrice.toString(),
    coinAmount: Web3Utils.fromWei(`${t.value}`),
    itumAmount: ethToItum(`${t.value}`).toString(),
    to: t.to,
    publicKey,
    hash: t.hash,
  }
  await txCoinToOutput(payload, options.ledger)
}

const toEthTransaction = (tx: Transaction): EthTransaction => {
  const data = (tx as any).input
  return (new EthTransaction({
    nonce: tx.nonce,
    gasPrice: bufferToHex(new BN(tx.gasPrice).toBuffer()),
    gasLimit: tx.gas,
    to: tx.to,
    value: bufferToHex(new BN(tx.value).toBuffer()),
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
        if (block && block.transactions) {
          block.transactions.forEach((t: Transaction) => {
            // if (transactions.length === 0 && i === currentBlock) {
            //  transactions.push(t)
            // }
            if (address === t.to) {
              // console.log('eth transaction match to', t)
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

    delayFunc(processTransactions, 60000 * 1)
  }

  delayFunc(processTransactions, delay)
}
