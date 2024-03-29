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

import { Utils } from '@arkecosystem/crypto';
import axios from 'axios';
import * as Web3Utils from 'web3-utils'

export interface IPriceOptions {
  itum: number
  itumPrice: Utils.BigNumber
  ethDiscount: Utils.BigNumber
  arkDiscount: Utils.BigNumber
  minPurchaseAmount: Utils.BigNumber
  maxPurchaseAmount: Utils.BigNumber
}

export let priceOpts = {
  itum: .015,
  itumPrice: new Utils.BigNumber(.015),
  ethDiscount: new Utils.BigNumber(1.0),
  arkDiscount: new Utils.BigNumber(1.5),
  minPurchaseAmount: new Utils.BigNumber(5000).shiftedBy(8),
  maxPurchaseAmount: new Utils.BigNumber(5000000).shiftedBy(8)
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
