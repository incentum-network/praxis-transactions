import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { startConnection } from "@incentum/praxis-db";
import { defaults } from "./defaults";
import { ContractActionTransactionHandler } from "./handlers/ContractActionTransactionHandler";
import { ContractStartTransactionHandler } from "./handlers/ContractStartTransactionHandler";
import { SaveTemplateTransactionHandler } from "./handlers/SaveTemplateTransactionHandler";
import { SearchTemplateTransactionHandler } from "./handlers/SearchTemplateTransactionHandler";

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
    Handlers.Registry.registerCustomTransactionHandler(ContractStartTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(ContractActionTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SaveTemplateTransactionHandler);
    Handlers.Registry.registerCustomTransactionHandler(SearchTemplateTransactionHandler);
  },
  async deregister(container: Container.IContainer, options) {
    container.resolvePlugin<Logger.ILogger>("logger").info("Deregistering Praxis Transactions");
    Handlers.Registry.deregisterCustomTransactionHandler(ContractStartTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(ContractActionTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SaveTemplateTransactionHandler);
    Handlers.Registry.deregisterCustomTransactionHandler(SearchTemplateTransactionHandler);
  }
};
