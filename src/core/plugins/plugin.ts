import type { CoreEntity, CoreRegistry } from "../registry";

export type CorePluginCapability =
  | "registry"
  | "search"
  | "discovery"
  | "personalization"
  | "player"
  | "editor"
  | "export";

export type CorePlugin<TEntity extends CoreEntity = CoreEntity> = {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: CorePluginCapability[];
  registry?: CoreRegistry<TEntity>;
};

export const hasCorePluginCapability = (plugin: CorePlugin, capability: CorePluginCapability) =>
  plugin.capabilities.includes(capability);
