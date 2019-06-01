import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { defaults } from "./defaults";
import { ContractStartTransactionHandler } from "./handlers/ContractStartTransactionHandler";

export const plugin: Container.IPluginDescriptor = {
  pkg: require("../package.json"),
  defaults,
  alias: "praxis-transactions",
  async register(container: Container.IContainer, options) {
    container.resolvePlugin<Logger.ILogger>("logger").info("Registering Praxis Transactions");
    Handlers.Registry.registerCustomTransactionHandler(ContractStartTransactionHandler);
  },
  async deregister(container: Container.IContainer, options) {
    container.resolvePlugin<Logger.ILogger>("logger").info("Deregistering Praxis Transactions");
    Handlers.Registry.deregisterCustomTransactionHandler(ContractStartTransactionHandler);
  }
};
