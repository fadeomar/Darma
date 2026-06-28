export type CoreActivityEventType = "view" | "open" | "play" | "favorite" | "copy" | "download" | "share";

export type CoreActivityEvent = {
  entityId: string;
  entityKind: string;
  type: CoreActivityEventType;
  at: number;
};

export type CoreActivitySummary = {
  recentEntityIds: string[];
  favoriteEntityIds: string[];
  totalsByType: Partial<Record<CoreActivityEventType, number>>;
};

export const summarizeCoreActivity = (events: readonly CoreActivityEvent[], favoriteEntityIds: readonly string[] = []): CoreActivitySummary => {
  const recentEntityIds = Array.from(new Set([...events].sort((a, b) => b.at - a.at).map((event) => event.entityId))).slice(0, 12);
  const totalsByType = events.reduce<CoreActivitySummary["totalsByType"]>((acc, event) => {
    acc[event.type] = (acc[event.type] ?? 0) + 1;
    return acc;
  }, {});

  return {
    recentEntityIds,
    favoriteEntityIds: [...favoriteEntityIds],
    totalsByType,
  };
};
