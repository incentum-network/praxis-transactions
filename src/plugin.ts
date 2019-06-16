import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities } from "@incentum/crypto";
import { ILedger } from "@incentum/praxis-client";
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
import { arkListener, ethListener, IArkOptions, IWeb3Options } from './listeners';

const opts = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '1nc3nt5m',
  database: 'incentum',
  entities: [],
}

const startListeners = async (logger, ledger: ILedger, ethAddress: string, ethStartingBlock: number) => {
  const ethOpts: IWeb3Options = {
    ledger,
    delay: 60 * 1000,
    logger,
    ethAddress,
    ethStartingBlock,
    endpoint: 'https://mainnet.infura.io/v3/2fb1e3eabcc34c9c85fb000202ac7ce6',
  }
  logger.debug(`starting eth listener`)
  await ethListener(ethOpts);

  const arkOpts: IArkOptions = {
    ledger,
    logger,
  }
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
    
    if (options.authorizedCoinSenderPassphrase && options.ethAddress) {
      const ethAddress: string = `${options.ethAddress}`
      const mnemonic: string = `${options.authorizedCoinSenderPassphrase}`
      const ethStartingBlock: number = Number(`${options.authorizedCoinSenderPassphrase}`)
      logger.debug(`found ethAddress, starting listeners: ${ethAddress}`)
      logger.debug(`found authorizedCoinSenderPassphrase, starting listeners: ${mnemonic}`)
      ledger = {
        ledger: Identities.Address.fromPassphrase(mnemonic),
        mnemonic,
      }
      await startListeners(logger, ledger, ethAddress, ethStartingBlock)
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
  }
};
