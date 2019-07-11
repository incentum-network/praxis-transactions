import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Utils } from "@incentum/crypto";
import { ILedger, setNetwork } from "@incentum/praxis-client";
import { startConnection } from "@incentum/praxis-db";
import { defaults } from "./defaults";
import { ContractFromInstanceTransactionHandler } from "./handlers";
import { ContractStartTransactionHandler } from "./handlers";
import { MatchSchemasTransactionHandler } from "./handlers";
import { SaveSchemasTransactionHandler } from "./handlers";
import { ContractActionTransactionHandler } from "./handlers";
import { ContractFromActionTransactionHandler } from "./handlers";
import { SearchTemplateTransactionHandler } from "./handlers";
import { UnusedOutputsTransactionHandler } from "./handlers";
import { AccountToOutputTransactionHandler } from "./handlers";
import { OutputToAccountTransactionHandler } from "./handlers";
import { SaveTemplateTransactionHandler } from "./handlers";
import { SearchInstanceTransactionHandler } from "./handlers";
import { CoinToOutputTransactionHandler } from "./handlers";
import { BaseTransactionHandler } from "./handlers/BaseTransactionHandler";
import { arkListener, ethListener, IArkOptions, IPriceOptions, IWeb3Options, updatePricesOptions } from './listeners';

const opts = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '1nc3nt5m',
  database: 'incentum',
  entities: [],
}

const startListeners = async (ethOpts: IWeb3Options, arkOpts: IArkOptions) => {
  ethOpts.logger.debug(`starting eth and ark listeners`)
  // await ethListener(ethOpts);
  await arkListener(arkOpts);
}

interface IPraxisPluginOptions {
  authorizedSenderPassphrase: string
}

let ledger: ILedger;
export const getAuthorizedLedger = (): ILedger => {
  return ledger
}

export const plugin: Container.IPluginDescriptor = {
  pkg: require("../package.json"),
  defaults,
  required: true,
  alias: "praxis-transactions",
  async register(container: Container.IContainer, options) {
    const logger: Logger.ILogger = container.resolvePlugin<Logger.ILogger>("logger")
    logger.debug(`registering praxis plugin`)
    
    if (options.authorizedCoinSenderPassphrase) {
      const arkAddress: string = `${options.arkAddress}`
      BaseTransactionHandler.arkListenAddress = arkAddress;
      const ethAddress: string = `${options.ethAddress}`
      const mnemonic: string = `${options.authorizedCoinSenderPassphrase}`
      const ethStartingBlock: number = Number(`${options.ethStartingBlock}`)
      const ethEndpoint: string = `${options.ethEndpoint}`
      const arkEndpoint: string = `${options.arkEndpoint}`
      const itum: number = Number(`${options.itum}`)
      const ethDiscount: number = Number(`${options.ethDiscount}`)
      const arkDiscount: number = Number(`${options.arkDiscount}`)
      const minPurchaseAmount = new Utils.BigNumber(`${options.minPurchaseAmount}`).shiftedBy(8)
      const maxPurchaseAmount = new Utils.BigNumber(`${options.maxPurchaseAmount}`).shiftedBy(8)
      const networkVersion: number = Number(`${options.network}`)

      const address = Identities.Address.fromPassphrase(mnemonic, networkVersion)
      BaseTransactionHandler.arkWalletAddress = address;
      ledger = {
        ledger: address,
        mnemonic,
      }
      const ethOpts: IWeb3Options = {
        ledger,
        delay: 15 * 1000,
        logger,
        ethAddress,
        ethStartingBlock,
        endpoint: ethEndpoint,
      }
      const arkOpts: IArkOptions = {
        ledger,
        logger,
        networkVersion,
        delay: 15 * 1000,
        address: arkAddress,
        endpoint: arkEndpoint,
      }
      const priceOpts: IPriceOptions = {
        itum,
        itumPrice: new Utils.BigNumber(itum),
        ethDiscount: new Utils.BigNumber(ethDiscount),
        arkDiscount: new Utils.BigNumber(arkDiscount),
        minPurchaseAmount,
        maxPurchaseAmount,
      }
      updatePricesOptions(priceOpts)
      setNetwork('local')
      await startListeners(ethOpts, arkOpts)
    }

    await startConnection(opts as any);
    logger.info("Registering Praxis Transactions");
    Handlers.Registry.registerCustomTransactionHandler(ContractActionTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(ContractFromActionTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(ContractFromInstanceTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(ContractStartTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(MatchSchemasTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SaveTemplateTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SaveSchemasTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SearchInstanceTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SearchTemplateTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(UnusedOutputsTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(AccountToOutputTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(OutputToAccountTransactionHandler);
    logger.info("Registering CoinToOutputTransactionHandler");
    Handlers.Registry.registerCustomTransactionHandler(CoinToOutputTransactionHandler);
  },
  async deregister(container: Container.IContainer, options) {
    container.resolvePlugin<Logger.ILogger>("logger").info("Deregistering Praxis Transactions");
    Handlers.Registry.deregisterCustomTransactionHandler(ContractActionTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(ContractFromActionTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(ContractFromInstanceTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(ContractStartTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(MatchSchemasTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SaveTemplateTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SaveSchemasTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SearchInstanceTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SearchTemplateTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(UnusedOutputsTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(AccountToOutputTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(OutputToAccountTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(CoinToOutputTransactionHandler);
  }
};
