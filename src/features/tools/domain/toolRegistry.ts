// src/features/tools/domain/toolRegistry.ts

import type {
  ToolAudience,
  ToolDefinition,
  ToolId,
  ToolLayoutType,
  ToolPrivacy,
} from "./tool";

export type ToolRegistryQuery = {
  q?: string;
  mainCategory?: string[];
  secondaryCategory?: string[];
  tags?: string[];
  audiences?: ToolAudience[];
  layoutTypes?: ToolLayoutType[];
  privacy?: ToolPrivacy[];
};

export interface ToolRegistry {
  list(): ToolDefinition[];
  getById(id: ToolId): ToolDefinition | null;
  search(query: ToolRegistryQuery): ToolDefinition[];
}
