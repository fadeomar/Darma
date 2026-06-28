export type CoreEntityKind = "tool" | "game" | "template" | "component" | "resource" | "ai" | "learning" | "collection";

export type CoreEntityStatus = "live" | "planned" | "experimental" | "deprecated";

export type CoreEntityAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
};

export type CoreEntityMetric = {
  label: string;
  value: string | number;
  helper?: string;
};

export type CoreEntity = {
  id: string;
  slug: string;
  kind: CoreEntityKind;
  title: string;
  description: string;
  href: string;
  status?: CoreEntityStatus;
  categories?: string[];
  tags?: string[];
  keywords?: string[];
  featured?: boolean;
  popular?: boolean;
  isNew?: boolean;
  pinned?: number;
  createdAt?: string;
  updatedAt?: string;
  accent?: string;
  thumbnail?: string;
  metrics?: CoreEntityMetric[];
  primaryAction?: CoreEntityAction;
  metadata?: Record<string, string | number | boolean | string[] | undefined>;
};

export type CoreRegistry<TEntity extends CoreEntity = CoreEntity> = {
  id: string;
  title: string;
  description?: string;
  items: readonly TEntity[];
};

export type CoreRegistryIndex<TEntity extends CoreEntity = CoreEntity> = {
  registries: readonly CoreRegistry<TEntity>[];
  items: readonly TEntity[];
  byId: Map<string, TEntity>;
  bySlug: Map<string, TEntity>;
  byKind: Map<CoreEntityKind, TEntity[]>;
};
