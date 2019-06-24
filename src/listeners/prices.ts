import { Utils } from '@arkecosystem/crypto';
import axios from 'axios';
import * as Web3Utils from 'web3-utils'

export interface IPriceOptions {
  itum: number
  itumPrice: Utils.BigNumber
  ethDiscount: Utils.BigNumber
  arkDiscount: Utils.BigNumber
}

export let priceOpts = {
  itum: .008,
  itumPrice: new Utils.BigNumber(.008),
  ethDiscount: new Utils.BigNumber(1.0),
  arkDiscount: new Utils.BigNumber(1.5),  
}

export let ethPrice = Utils.BigNumber.ZERO
export let arkPrice = Utils.BigNumber.ZERO

export const getMarketPrice = async (symbol: string, def: Utils.BigNumber): Promise<Utils.BigNumber> => {
  try {
    const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    return res.status === 200 ? new Utils.BigNumber(res.data.price) : def;
  } catch (e) {
    console.log('getMarketPrice', e)
  }
  return def
}

export const updateEthPrice = async (): Promise<Utils.BigNumber> => {
  return await getMarketPrice('ETHUSDT', ethPrice);
}

export const updateArkPrice = async (): Promise<Utils.BigNumber> => {
  return (await getMarketPrice('ARKETH', arkPrice)).multipliedBy(ethPrice);
}

export const ethToItum = (wei: string): Utils.BigNumber => {
  const eth = Web3Utils.fromWei(wei)
  return ethPrice.dividedBy(priceOpts.itumPrice).multipliedBy(eth).multipliedBy(priceOpts.ethDiscount).shiftedBy(8)
}

export const arkToItum = (arks: string): Utils.BigNumber => {
  console.log('arkToItum', priceOpts)
  const ark = new Utils.BigNumber(arks)
  return arkPrice.dividedBy(priceOpts.itumPrice).multipliedBy(ark).multipliedBy(priceOpts.arkDiscount)
}

export const updatePricesOptions = async (thePriceOpts: IPriceOptions) => {
  priceOpts = thePriceOpts
}

export const updatePrices = async () => {
  ethPrice = await updateEthPrice();
  arkPrice = await updateArkPrice();
}

export const delayFunc = (func: () => void, delay: number) => {
  setTimeout(() => func(), delay)
}