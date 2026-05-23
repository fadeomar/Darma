import type { ToolDefinition } from "@/features/tools/domain/tool";

export type ScoredTool = {
  tool: ToolDefinition;
  score: number;
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function includesAny(values: readonly string[] = [], term: string) {
  return values.some((value) => normalize(value).includes(term));
}

function exactAny(values: readonly string[] = [], term: string) {
  return values.some((value) => normalize(value) === term);
}

export function scoreTool(tool: ToolDefinition, rawQuery: string): number {
  const query = normalize(rawQuery);
  if (!query) return 0;

  const terms = query.split(/\s+/).filter(Boolean);
  const title = normalize(tool.title);
  const slug = normalize(tool.id);
  const description = normalize(tool.description);
  const keywords = (tool.keywords ?? []).map(normalize);
  const categories = [...(tool.mainCategory ?? []), ...(tool.secondaryCategory ?? []), ...(tool.tags ?? [])].map(normalize);
  const audiences = (tool.audiences ?? []).map(normalize);
  const related = (tool.relatedTools ?? []).map(normalize);

  let score = 0;

  if (title === query) score += 100;
  if (title.startsWith(query)) score += 80;
  if (slug.includes(query)) score += 70;
  if (exactAny(keywords, query)) score += 60;
  if (includesAny(categories, query)) score += 45;
  if (includesAny(audiences, query)) score += 35;
  if (description.includes(query)) score += 20;
  if (includesAny(related, query)) score += 15;

  for (const term of terms) {
    if (title.includes(term)) score += 26;
    if (slug.includes(term)) score += 22;
    if (includesAny(keywords, term)) score += 18;
    if (includesAny(categories, term)) score += 12;
    if (includesAny(audiences, term)) score += 8;
    if (description.includes(term)) score += 5;
    if (includesAny(related, term)) score += 4;
  }

  return score;
}

export function scoreTools(tools: ToolDefinition[], query: string): ScoredTool[] {
  const trimmed = query.trim();
  if (!trimmed) return tools.map((tool) => ({ tool, score: 0 }));

  return tools
    .map((tool) => ({ tool, score: scoreTool(tool, trimmed) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title));
}

export function suggestToolQueries(tools: ToolDefinition[], rawQuery: string, limit = 5): string[] {
  const query = normalize(rawQuery);
  const pool = new Set<string>();

  for (const tool of tools) {
    pool.add(tool.title);
    for (const keyword of tool.keywords ?? []) pool.add(keyword);
    for (const category of tool.mainCategory ?? []) pool.add(category);
    for (const tag of tool.tags ?? []) pool.add(tag);
  }

  return Array.from(pool)
    .filter((item) => {
      const normalized = normalize(item);
      return normalized !== query && (normalized.includes(query.slice(0, 3)) || query.includes(normalized.slice(0, 3)));
    })
    .slice(0, limit);
}
