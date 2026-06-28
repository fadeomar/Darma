import { createCoreRegistryIndex, type CoreEntity, type CoreRegistry } from "@/core";
import type { ToolDefinition, ToolPrivacy, ToolStatus } from "../domain/tool";

export type ToolCoreEntity = CoreEntity & {
  kind: "tool";
  metadata: NonNullable<CoreEntity["metadata"]> & {
    layoutType?: string;
    privacy?: ToolPrivacy;
    difficulty?: string;
    powerLevel?: string;
    audiences?: string[];
    completion?: number;
    dailyUseScore?: number;
  };
};

const toolStatusToCoreStatus: Record<ToolStatus, NonNullable<CoreEntity["status"]>> = {
  ready: "live",
  in_progress: "experimental",
  planned: "planned",
};

const toolPrivacyLabel: Record<ToolPrivacy, string> = {
  "client-only": "Browser-only",
  "local-storage": "Local storage",
  "server-assisted": "Server assisted",
  "external-api": "External API",
};

const toolLayoutLabel: Record<string, string> = {
  "text-workbench": "Text workbench",
  "visual-generator": "Visual generator",
  "fullscreen-studio": "Fullscreen studio",
  "single-utility": "Utility",
  "interactive-challenge": "Challenge",
  directory: "Directory",
};

const toolPowerLabel: Record<string, string> = {
  light: "Light",
  standard: "Standard",
  pro: "Pro",
};

const formatOptionalDate = (date?: Date) => {
  if (!date) return undefined;
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const toTitleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function toToolCoreEntity(tool: ToolDefinition): ToolCoreEntity {
  const layout = tool.layoutType ? toolLayoutLabel[tool.layoutType] ?? toTitleCase(tool.layoutType) : "Tool";
  const privacy = tool.privacy ? toolPrivacyLabel[tool.privacy] : undefined;
  const power = tool.toolPowerLevel ? toolPowerLabel[tool.toolPowerLevel] ?? toTitleCase(tool.toolPowerLevel) : undefined;
  const primaryAudience = tool.audiences?.[0];
  const primaryCategory = tool.secondaryCategory?.[0] ?? tool.mainCategory?.[0] ?? "tools";

  return {
    id: tool.id,
    slug: tool.id,
    kind: "tool",
    title: tool.title,
    description: tool.shortDescription ?? tool.description,
    href: tool.href,
    status: tool.status ? toolStatusToCoreStatus[tool.status] : "live",
    categories: [...new Set([...(tool.secondaryCategory ?? []), ...(tool.mainCategory ?? [])])],
    tags: tool.tags,
    keywords: [
      tool.title,
      tool.description,
      tool.shortDescription ?? "",
      ...(tool.tags ?? []),
      ...(tool.mainCategory ?? []),
      ...(tool.secondaryCategory ?? []),
      ...(tool.audiences ?? []),
      ...(tool.useCases ?? []),
      ...(tool.benefits ?? []),
      ...(tool.examples ?? []),
      ...(tool.keywords ?? []),
      tool.layoutType ?? "",
      tool.privacy ?? "",
      tool.toolCategory ?? "",
      tool.difficulty ?? "",
      tool.toolPowerLevel ?? "",
    ].filter(Boolean),
    featured: Boolean(tool.featured),
    popular: (tool.dailyUseScore ?? 0) >= 80 || Boolean(tool.pinned),
    isNew: false,
    pinned: tool.pinned,
    createdAt: formatOptionalDate(tool.createdAt),
    updatedAt: formatOptionalDate(tool.updatedAt),
    accent: tool.layoutType === "interactive-challenge" ? "violet" : tool.layoutType === "visual-generator" ? "teal" : "orange",
    thumbnail: tool.icon,
    primaryAction: {
      label: "Open tool",
      href: tool.href,
      variant: "primary",
    },
    metrics: [
      {
        label: "Type",
        value: layout,
      },
      privacy
        ? {
            label: "Privacy",
            value: privacy,
          }
        : undefined,
      power
        ? {
            label: "Power",
            value: power,
          }
        : undefined,
      primaryAudience
        ? {
            label: "Audience",
            value: toTitleCase(primaryAudience),
          }
        : undefined,
      {
        label: "Category",
        value: toTitleCase(primaryCategory),
      },
    ].filter(Boolean) as NonNullable<CoreEntity["metrics"]>,
    metadata: {
      layoutType: tool.layoutType,
      privacy: tool.privacy,
      difficulty: tool.difficulty,
      powerLevel: tool.toolPowerLevel,
      audiences: tool.audiences,
      completion: tool.completion,
      dailyUseScore: tool.dailyUseScore,
      toolCategory: tool.toolCategory,
    },
  };
}

export function toToolCoreEntities(tools: readonly ToolDefinition[]): ToolCoreEntity[] {
  return tools.map(toToolCoreEntity);
}

export function createToolCoreRegistry(tools: readonly ToolDefinition[]): CoreRegistry<ToolCoreEntity> {
  return {
    id: "tools",
    title: "Darma Tools",
    description: "CoreEntity registry adapter for Darma browser tools.",
    items: toToolCoreEntities(tools),
  };
}

export function createToolCoreIndex(tools: readonly ToolDefinition[]) {
  return createCoreRegistryIndex([createToolCoreRegistry(tools)]);
}

export function getToolCoreBridgeStats(tools: readonly ToolDefinition[]) {
  const entities = toToolCoreEntities(tools);
  const categories = new Set(entities.flatMap((entity) => entity.categories ?? []));
  const tags = new Set(entities.flatMap((entity) => entity.tags ?? []));
  const layouts = new Set(tools.map((tool) => tool.layoutType).filter(Boolean));
  const audiences = new Set(tools.flatMap((tool) => tool.audiences ?? []));
  const privacyModes = new Set(tools.map((tool) => tool.privacy).filter(Boolean));
  const featured = entities.filter((entity) => entity.featured).length;
  const popular = entities.filter((entity) => entity.popular).length;
  const live = entities.filter((entity) => entity.status === "live").length;

  return {
    entities: entities.length,
    categories: categories.size,
    tags: tags.size,
    layouts: layouts.size,
    audiences: audiences.size,
    privacyModes: privacyModes.size,
    featured,
    popular,
    live,
    coverage: [
      ["Core entities", entities.length],
      ["Categories", categories.size],
      ["Tags", tags.size],
      ["Layouts", layouts.size],
      ["Audiences", audiences.size],
      ["Privacy modes", privacyModes.size],
      ["Featured", featured],
      ["Popular", popular],
      ["Live", live],
    ].map(([label, value]) => ({ label: String(label), value: String(value) })),
    topCategories: [...categories].slice(0, 8).map(toTitleCase),
  };
}
