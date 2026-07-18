import type { ToolDefinition } from "@/features/tools/domain/tool";

const audienceLabels: Record<string, string> = {
  developer: "Developer",
  designer: "Designer",
  student: "Student",
  creator: "Creator",
  general: "General",
  business: "Business",
};

const MAX_CATEGORIES = 3;
const MAX_TAGS = 5;

export function formatCategory(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function audienceLabel(value: string) {
  return audienceLabels[value] ?? value;
}

export type ToolProfile = {
  audiences: string[];
  categories: string[];
  tags: string[];
  /**
   * True when the profile aside would render at least one badge or tag.
   *
   * This is deliberately computed from the resolved, filtered content rather
   * than from the truthiness of the wrapper or the presence of a `tool` prop:
   * a tool can exist and still have nothing worth showing, and an aside
   * containing only its own "Tool profile" heading is worse than no aside.
   */
  hasMeaningfulContent: boolean;
};

function cleanList(values: readonly string[] | undefined, limit?: number): string[] {
  const cleaned = (values ?? []).map((value) => value.trim()).filter(Boolean);
  return limit === undefined ? cleaned : cleaned.slice(0, limit);
}

/**
 * Resolves the metadata the ToolPage header aside is willing to display.
 *
 * Callers should render the aside — and reserve its desktop grid track — only
 * when `hasMeaningfulContent` is true.
 */
export function resolveToolProfile(tool?: ToolDefinition): ToolProfile {
  const audiences = cleanList(tool?.audiences);
  const categories = cleanList(tool?.secondaryCategory, MAX_CATEGORIES);
  const tags = cleanList(tool?.tags, MAX_TAGS);

  return {
    audiences,
    categories,
    tags,
    hasMeaningfulContent: audiences.length > 0 || categories.length > 0 || tags.length > 0,
  };
}
