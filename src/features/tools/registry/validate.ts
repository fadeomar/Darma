import type { ToolDefinition } from "../domain/tool";

/**
 * "Production" reads as internal build vocabulary in a catalog title — every
 * tool here is production quality, so the word only made titles longer and
 * pushed the actual task ("Meta Tag Generator") out of the card. Descriptions
 * are untouched: "production-ready export" is still meaningful there.
 */
const FORBIDDEN_TITLE_WORD = /\bproduction\b/i;

export function hasForbiddenToolTitleWord(title: string) {
  return FORBIDDEN_TITLE_WORD.test(title);
}

export function findToolTitleIssues(tools: ToolDefinition[]) {
  return tools
    .filter((tool) => tool.visibility === "public" && hasForbiddenToolTitleWord(tool.title))
    .map((tool) => ({ id: tool.id, title: tool.title }));
}

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

    if (tool.visibility === "public" && hasForbiddenToolTitleWord(tool.title)) {
      console.warn(`[tools] Public tool "${tool.id}" title must not contain "Production": ${tool.title}`);
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
