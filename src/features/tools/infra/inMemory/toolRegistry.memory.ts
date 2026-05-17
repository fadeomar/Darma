// src/features/tools/infra/inMemory/toolRegistry.memory.ts

import type { ToolDefinition, ToolId } from "../../domain/tool";
import type {
  ToolRegistry,
  ToolRegistryQuery,
} from "../../domain/toolRegistry";

function includesInsensitive(hay: string | undefined, needle: string): boolean {
  return (hay ?? "").toLowerCase().includes(needle.toLowerCase());
}

function searchableValues(tool: ToolDefinition): string[] {
  return [
    tool.id,
    tool.title,
    tool.description,
    tool.href,
    tool.layoutType ?? "",
    tool.privacy ?? "",
    tool.status ?? "",
    tool.toolCategory ?? "",
    ...tool.tags,
    ...tool.mainCategory,
    ...tool.secondaryCategory,
    ...(tool.audiences ?? []),
    ...(tool.keywords ?? []),
    ...(tool.relatedTools ?? []),
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

      if (!q) return true;

      return searchableValues(tool).some((value) => includesInsensitive(value, q));
    });
  }
}
