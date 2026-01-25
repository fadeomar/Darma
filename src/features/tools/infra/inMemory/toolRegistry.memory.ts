// src/features/tools/infra/inMemory/toolRegistry.memory.ts

import type { ToolDefinition, ToolId } from "../../domain/tool";
import type {
  ToolRegistry,
  ToolRegistryQuery,
} from "../../domain/toolRegistry";

function includesInsensitive(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.toLowerCase());
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

    return this.tools.filter((t) => {
      if (t.visibility !== "public") return false;

      if (main.length > 0 && !t.mainCategory.some((x) => main.includes(x)))
        return false;
      if (
        secondary.length > 0 &&
        !t.secondaryCategory.some((x) => secondary.includes(x))
      )
        return false;
      if (tags.length > 0 && !t.tags.some((x) => tags.includes(x)))
        return false;

      if (!q) return true;

      return (
        includesInsensitive(t.title, q) ||
        includesInsensitive(t.description, q) ||
        t.tags.some((tag) => includesInsensitive(tag, q))
      );
    });
  }
}
