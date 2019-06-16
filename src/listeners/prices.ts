import { Utils } from '@arkecosystem/crypto';
import axios from 'axios';
import * as Web3Utils from 'web3-utils'

const itum = .008;
export const itumPrice = new Utils.BigNumber(itum)

export let ethPrice = Utils.BigNumber.ZERO
export let arkPrice = Utils.BigNumber.ZERO

export const getMarketPrice = async (symbol: string, def: Utils.BigNumber): Promise<Utils.BigNumber> => {
  const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
  return res.status === 200 ? new Utils.BigNumber(res.data.price) : def;
}

export const updateEthPrice = async (): Promise<Utils.BigNumber> => {
  return await getMarketPrice('ETHUSDT', ethPrice);
}

export const updateArkPrice = async (): Promise<Utils.BigNumber> => {
  return (await getMarketPrice('ARKETH', arkPrice)).multipliedBy(ethPrice);
}

export const ethToItum = (wei: string): Utils.BigNumber => {
  const eth = Web3Utils.fromWei(wei)
  return ethPrice.dividedBy(itumPrice).multipliedBy(eth)
}

export const arkToItum = (arks: string): Utils.BigNumber => {
  const ark = new Utils.BigNumber(arks).shiftedBy(-8)
  return arkPrice.dividedBy(itumPrice).multipliedBy(ark)
}

export const updatePrices = async () => {
  ethPrice = await updateEthPrice();
  arkPrice = await updateArkPrice();
}

export const delayFunc = (func: () => void, delay: number) => {
  setTimeout(() => func(), delay)
}
