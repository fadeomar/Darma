// src/features/tools/infra/inMemory/toolRegistry.memory.ts

import type { ToolDefinition, ToolId } from "../../domain/tool";
import type {
  ToolRegistry,
  ToolRegistryQuery,
} from "../../domain/toolRegistry";

function includesInsensitive(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

function getSearchableValues(tool: ToolDefinition): string[] {
  return [
    tool.title,
    tool.description,
    ...(tool.tags ?? []),
    ...(tool.keywords ?? []),
    ...(tool.audiences ?? []),
    ...(tool.mainCategory ?? []),
    ...(tool.secondaryCategory ?? []),
    tool.privacy ?? "",
    tool.layoutType ?? "",
    tool.toolCategory ?? "",
  ];
}

export class InMemoryToolRegistry implements ToolRegistry {
  constructor(private readonly tools: ToolDefinition[]) {}

  list(): ToolDefinition[] {
    return [...this.tools];
  }

  getById(id: ToolId): ToolDefinition | null {
    return this.tools.find((t) => t.id === id) ?? null;
  }

  search(query: ToolRegistryQuery): ToolDefinition[] {
    const q = query.q?.trim();
    const main = query.mainCategory ?? [];
    const secondary = query.secondaryCategory ?? [];
    const tags = query.tags ?? [];
    const audiences = query.audiences ?? [];
    const layoutTypes = query.layoutTypes ?? [];
    const privacy = query.privacy ?? [];

    return this.tools.filter((tool) => {
      if (tool.visibility !== "public") return false;

      if (main.length > 0 && !tool.mainCategory.some((x) => main.includes(x))) {
        return false;
      }
      if (
        secondary.length > 0 &&
        !tool.secondaryCategory.some((x) => secondary.includes(x))
      ) {
        return false;
      }
      if (tags.length > 0 && !tool.tags.some((x) => tags.includes(x))) {
        return false;
      }
      if (
        audiences.length > 0 &&
        !(tool.audiences ?? []).some((x) => audiences.includes(x))
      ) {
        return false;
      }
      if (
        layoutTypes.length > 0 &&
        (!tool.layoutType || !layoutTypes.includes(tool.layoutType))
      ) {
        return false;
      }
      if (
        privacy.length > 0 &&
        (!tool.privacy || !privacy.includes(tool.privacy))
      ) {
        return false;
      }

      if (!q) return true;

      return getSearchableValues(tool).some((value) => includesInsensitive(value, q));
    });
  }
}
