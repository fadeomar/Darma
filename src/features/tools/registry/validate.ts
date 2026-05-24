import type { ToolDefinition } from "../domain/tool";

export function validateToolRegistry(tools: ToolDefinition[]) {
  if (process.env.NODE_ENV === "production") return;

  const ids = new Set<string>();

  for (const tool of tools) {
    if (ids.has(tool.id)) {
      console.warn(`[tools] Duplicate tool id: ${tool.id}`);
    }

    ids.add(tool.id);

    if (tool.visibility === "public" && tool.href !== `/tools/${tool.id}`) {
      console.warn(`[tools] Tool "${tool.id}" href does not match id: ${tool.href}`);
    }

    if (!tool.privacy) {
      console.warn(`[tools] Tool "${tool.id}" is missing privacy metadata`);
    }

    if (!tool.keywords?.length) {
      console.warn(`[tools] Tool "${tool.id}" is missing keywords`);
    }

    if (!tool.relatedTools?.length) {
      console.warn(`[tools] Tool "${tool.id}" is missing relatedTools`);
    }
  }

  for (const tool of tools) {
    for (const relatedId of tool.relatedTools ?? []) {
      if (!ids.has(relatedId)) {
        console.warn(`[tools] Tool "${tool.id}" references unknown related tool "${relatedId}"`);
      }

      if (relatedId === tool.id) {
        console.warn(`[tools] Tool "${tool.id}" references itself in relatedTools`);
      }
    }
  }
}
