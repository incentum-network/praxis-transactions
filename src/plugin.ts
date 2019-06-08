import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { startConnection } from "@incentum/praxis-db";
import { defaults } from "./defaults";
import { ContractActionTransactionHandler } from "./handlers";
import { ContractFromActionTransactionHandler } from "./handlers";
import { ContractFromInstanceTransactionHandler } from "./handlers";
import { ContractStartTransactionHandler } from "./handlers";
import { MatchSchemasTransactionHandler } from "./handlers";
import { SaveSchemasTransactionHandler } from "./handlers";
import { SaveTemplateTransactionHandler } from "./handlers";
import { SearchInstanceTransactionHandler } from "./handlers";
import { SearchTemplateTransactionHandler } from "./handlers";
import { UnusedOutputsTransactionHandler } from "./handlers";
import { AccountToOutputTransactionHandler } from "./handlers";
import { OutputToAccountTransactionHandler } from "./handlers";

const opts = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '1nc3nt5m',
  database: 'incentum',
  entities: [],
}

export const plugin: Container.IPluginDescriptor = {
  pkg: require("../package.json"),
  defaults,
  alias: "praxis-transactions",
  async register(container: Container.IContainer, options) {
    await startConnection(opts as any);
    container.resolvePlugin<Logger.ILogger>("logger").info("Registering Praxis Transactions");
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
