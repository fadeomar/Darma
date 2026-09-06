import type { CoreEntity, CoreEntityKind } from "../registry";

export type CoreRelationReason =
  | "workflow-member"
  | "shared-category"
  | "shared-tag"
  | "shared-keyword"
  | "similar-topic";

export type ResolvedCoreRelation = {
  entity: CoreEntity;
  score: number;
  reasons: CoreRelationReason[];
  reasonLabel: string;
};

export type ResolveCoreRelationsOptions = {
  limit?: number;
  kinds?: readonly CoreEntityKind[];
  excludeKinds?: readonly CoreEntityKind[];
};

const reasonLabels: Record<CoreRelationReason, string> = {
  "workflow-member": "Part of this workflow",
  "shared-category": "Same topic",
  "shared-tag": "Related topic",
  "shared-keyword": "Similar use case",
  "similar-topic": "Related",
};

const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "into", "your", "this", "that", "tool", "tools", "project", "projects",
  "workflow", "workflows", "darma", "use", "using", "create", "build", "open", "browser", "page", "pages", "local",
]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizedSet(values: readonly string[] = []) {
  return new Set(values.map(normalize).filter(Boolean));
}

function overlap(left: readonly string[] = [], right: readonly string[] = []) {
  const rightSet = normalizedSet(right);
  return [...normalizedSet(left)].filter((value) => rightSet.has(value));
}

function topicTokens(entity: CoreEntity) {
  const shortSignals = [
    entity.title,
    ...(entity.categories ?? []),
    ...(entity.tags ?? []),
    ...(entity.keywords ?? []).filter((value) => value.length <= 48),
  ];

  return new Set(
    shortSignals
      .flatMap((value) => normalize(value).split(/[^a-z0-9+#.-]+/g))
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function workflowContainsTool(workflow: CoreEntity, tool: CoreEntity) {
  if (workflow.kind !== "workflow" || tool.kind !== "tool") return false;
  return (workflow.tags ?? []).some((tag) => normalize(tag) === normalize(tool.id));
}

function addReason(
  target: { score: number; reasons: Set<CoreRelationReason> },
  reason: CoreRelationReason,
  score: number,
) {
  target.score += score;
  target.reasons.add(reason);
}

export function resolveCoreRelations(
  source: CoreEntity,
  entities: readonly CoreEntity[],
  options: ResolveCoreRelationsOptions = {},
): ResolvedCoreRelation[] {
  const limit = options.limit ?? 6;
  const allowedKinds = options.kinds ? new Set(options.kinds) : null;
  const excludedKinds = new Set(options.excludeKinds ?? []);
  const sourceTokens = topicTokens(source);

  const scored = entities
    .filter((candidate) => candidate.id !== source.id)
    .filter((candidate) => candidate.status !== "planned" && candidate.status !== "deprecated")
    .filter((candidate) => !allowedKinds || allowedKinds.has(candidate.kind))
    .filter((candidate) => !excludedKinds.has(candidate.kind))
    .map((candidate) => {
      const item = { score: 0, reasons: new Set<CoreRelationReason>() };

      if (workflowContainsTool(candidate, source) || workflowContainsTool(source, candidate)) {
        addReason(item, "workflow-member", 140);
      }

      const categoryMatches = overlap(source.categories, candidate.categories);
      if (categoryMatches.length) addReason(item, "shared-category", Math.min(70, 35 * categoryMatches.length));

      const tagMatches = overlap(source.tags, candidate.tags);
      if (tagMatches.length) addReason(item, "shared-tag", Math.min(60, 24 * tagMatches.length));

      const keywordMatches = overlap(source.keywords, candidate.keywords);
      if (keywordMatches.length) addReason(item, "shared-keyword", Math.min(42, 14 * keywordMatches.length));

      const candidateTokens = topicTokens(candidate);
      const tokenMatches = [...sourceTokens].filter((token) => candidateTokens.has(token));
      if (tokenMatches.length >= 2) addReason(item, "similar-topic", Math.min(30, tokenMatches.length * 5));

      return { candidate, ...item };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.candidate.title.localeCompare(b.candidate.title));

  // Prevent one product kind from taking over the rail when other useful kinds exist.
  const selected: typeof scored = [];
  const kindCounts = new Map<CoreEntityKind, number>();
  const softKindCap = Math.max(2, Math.ceil(limit / 2));

  for (const item of scored) {
    const kindCount = kindCounts.get(item.candidate.kind) ?? 0;
    if (kindCount >= softKindCap && scored.some((other) => other.candidate.kind !== item.candidate.kind && !selected.includes(other))) {
      continue;
    }
    selected.push(item);
    kindCounts.set(item.candidate.kind, kindCount + 1);
    if (selected.length >= limit) break;
  }

  if (selected.length < limit) {
    for (const item of scored) {
      if (selected.includes(item)) continue;
      selected.push(item);
      if (selected.length >= limit) break;
    }
  }

  return selected.map((item) => {
    const reasons = [...item.reasons];
    const primary = reasons[0] ?? "similar-topic";
    return {
      entity: item.candidate,
      score: item.score,
      reasons,
      reasonLabel: reasonLabels[primary],
    };
  });
}
