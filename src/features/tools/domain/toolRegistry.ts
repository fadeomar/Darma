// src/features/tools/domain/toolRegistry.ts

import type { ToolDefinition, ToolId } from "./tool";

export type ToolRegistryQuery = {
  q?: string;
  mainCategory?: string[];
  secondaryCategory?: string[];
  tags?: string[];
};

export interface ToolRegistry {
  list(): ToolDefinition[];
  getById(id: ToolId): ToolDefinition | null;
  search(query: ToolRegistryQuery): ToolDefinition[];
}
