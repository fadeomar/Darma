import type { ToolDefinition, ToolId } from "@/features/tools/domain/tool";
import { getToolRegistry } from "@/features/tools/registry";
import { toolWorkflows } from "@/features/tools/workflows";

export type RelatedToolReason =
  | "explicit"
  | "same-category"
  | "shared-keyword"
  | "same-audience"
  | "privacy-match"
  | "same-layout"
  | "workflow-next-step";

export type ResolvedRelatedTool = {
  tool: ToolDefinition;
  score: number;
  reasons: RelatedToolReason[];
  reasonLabel: string;
};

const reasonLabels: Record<RelatedToolReason, string> = {
  explicit: "Related",
  "same-category": "Same category",
  "shared-keyword": "Shared keyword",
  "same-audience": "Same audience",
  "privacy-match": "Same privacy",
  "same-layout": "Similar layout",
  "workflow-next-step": "Workflow step",
};

function addReason(target: Map<ToolId, { tool: ToolDefinition; score: number; reasons: Set<RelatedToolReason> }>, tool: ToolDefinition, reason: RelatedToolReason, score: number) {
  const existing = target.get(tool.id);
  if (existing) {
    existing.score += score;
    existing.reasons.add(reason);
    return;
  }
  target.set(tool.id, { tool, score, reasons: new Set([reason]) });
}

function intersects<T>(left: readonly T[] = [], right: readonly T[] = []) {
  const values = new Set(left);
  return right.some((value) => values.has(value));
}

function workflowNeighbors(currentToolId: ToolId) {
  return toolWorkflows.flatMap((workflow) => {
    const index = workflow.toolIds.indexOf(currentToolId);
    if (index === -1) return [];
    return workflow.toolIds.filter((id) => id !== currentToolId);
  });
}

export function resolveRelatedTools(currentToolId: string, options?: { limit?: number; includeReasons?: boolean }): ResolvedRelatedTool[] {
  const limit = options?.limit ?? 6;
  const registry = getToolRegistry();
  const current = registry.getById(currentToolId);
  if (!current) return [];

  const tools = registry.list().filter((tool) => tool.visibility === "public" && tool.id !== current.id);
  const byId = new Map(tools.map((tool) => [tool.id, tool]));
  const scored = new Map<ToolId, { tool: ToolDefinition; score: number; reasons: Set<RelatedToolReason> }>();

  for (const id of current.relatedTools ?? []) {
    const tool = byId.get(id);
    if (tool) addReason(scored, tool, "explicit", 100);
  }

  for (const id of workflowNeighbors(current.id)) {
    const tool = byId.get(id);
    if (tool) addReason(scored, tool, "workflow-next-step", 70);
  }

  for (const tool of tools) {
    if (intersects(current.mainCategory, tool.mainCategory) || intersects(current.secondaryCategory, tool.secondaryCategory)) {
      addReason(scored, tool, "same-category", 35);
    }
    if (intersects(current.keywords ?? [], tool.keywords ?? []) || intersects(current.tags, tool.tags)) {
      addReason(scored, tool, "shared-keyword", 22);
    }
    if (intersects(current.audiences ?? [], tool.audiences ?? [])) {
      addReason(scored, tool, "same-audience", 16);
    }
    if (current.layoutType && current.layoutType === tool.layoutType) {
      addReason(scored, tool, "same-layout", 10);
    }
    if (current.privacy && current.privacy === tool.privacy) {
      addReason(scored, tool, "privacy-match", 3);
    }
  }

  return Array.from(scored.values())
    .sort((a, b) => b.score - a.score || a.tool.title.localeCompare(b.tool.title))
    .slice(0, limit)
    .map((item) => {
      const reasons = Array.from(item.reasons);
      const primaryReason = reasons[0] ?? "same-category";
      return {
        tool: item.tool,
        score: item.score,
        reasons,
        reasonLabel: reasonLabels[primaryReason],
      };
    });
}
