import type { ProgressionEventKind, ProgressionStats } from "./reactionTypes";

export type XpGrant = {
  kind: ProgressionEventKind;
  amount: number;
  label: string;
  detail?: string;
  at: string;
};

export type ProgressionRank = {
  id: string;
  title: string;
  glyph: string;
  note: string;
};

export const XP_HISTORY_LIMIT = 12;

const LEVEL_STEP_XP = 120;

const RANKS: { minLevel: number; rank: ProgressionRank }[] = [
  {
    minLevel: 1,
    rank: {
      id: "beginner",
      title: "Beginner",
      glyph: "🌱",
      note: "Start with short, clean runs.",
    },
  },
  {
    minLevel: 3,
    rank: {
      id: "focused",
      title: "Focused",
      glyph: "🎯",
      note: "Your reflex routine is forming.",
    },
  },
  {
    minLevel: 6,
    rank: {
      id: "sharp",
      title: "Sharp",
      glyph: "⚡",
      note: "Speed and consistency are improving.",
    },
  },
  {
    minLevel: 10,
    rank: {
      id: "quick-hands",
      title: "Quick Hands",
      glyph: "🤲",
      note: "You are comfortable across multiple modes.",
    },
  },
  {
    minLevel: 15,
    rank: {
      id: "reflex-pro",
      title: "Reflex Pro",
      glyph: "🏅",
      note: "You have built strong local progress.",
    },
  },
  {
    minLevel: 22,
    rank: {
      id: "elite-reflex",
      title: "Elite Reflex",
      glyph: "💎",
      note: "Advanced reflex training unlocked.",
    },
  },
  {
    minLevel: 30,
    rank: {
      id: "reflex-master",
      title: "Reflex Master",
      glyph: "👑",
      note: "A long-term Darma reflex routine.",
    },
  },
];

export const XP_EVENT_LABELS: Record<ProgressionEventKind, string> = {
  "classic-run": "Classic run",
  "practice-run": "Practice session",
  "precision-run": "Precision attempt",
  "target-hunter-run": "Target Hunter run",
  "level-challenge-run": "Level Challenge attempt",
  "daily-challenge": "Daily Challenge",
  "local-battle": "Local Battle",
  share: "Shared result",
  achievement: "Achievement unlocked",
};

export const XP_EVENT_AMOUNTS: Record<ProgressionEventKind, number> = {
  "classic-run": 80,
  "practice-run": 25,
  "precision-run": 55,
  "target-hunter-run": 75,
  "level-challenge-run": 90,
  "daily-challenge": 100,
  "local-battle": 90,
  share: 25,
  achievement: 50,
};

export function emptyProgressionStats(): ProgressionStats {
  return {
    xp: 0,
    level: 1,
    rankTitle: "Beginner",
    unlockedRankTitles: ["Beginner"],
    xpHistory: [],
    totalXpEvents: 0,
    lastProgressionUpdate: null,
  };
}

export function getXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.pow(safeLevel - 1, 2) * LEVEL_STEP_XP;
}

export function getLevelFromXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  return Math.max(1, Math.floor(Math.sqrt(safeXp / LEVEL_STEP_XP)) + 1);
}

export function getProgressionRank(level: number): ProgressionRank {
  const safeLevel = Math.max(1, Math.floor(level));
  let selected = RANKS[0].rank;
  for (const entry of RANKS) {
    if (safeLevel >= entry.minLevel) selected = entry.rank;
  }
  return selected;
}

export function getXpProgress(xp: number): { level: number; current: number; needed: number; pct: number; nextLevelXp: number } {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = getLevelFromXp(safeXp);
  const floor = getXpForLevel(level);
  const next = getXpForLevel(level + 1);
  const needed = Math.max(1, next - floor);
  const current = Math.max(0, safeXp - floor);
  const pct = Math.max(0, Math.min(100, Math.round((current / needed) * 100)));
  return { level, current, needed, pct, nextLevelXp: next };
}

export function normalizeProgressionStats(value: unknown): ProgressionStats {
  const empty = emptyProgressionStats();
  if (!value || typeof value !== "object") return empty;
  const v = value as Partial<ProgressionStats>;
  const xp = typeof v.xp === "number" && Number.isFinite(v.xp) && v.xp > 0 ? Math.floor(v.xp) : 0;
  const level = getLevelFromXp(xp);
  const rank = getProgressionRank(level);
  const xpHistory = Array.isArray(v.xpHistory)
    ? v.xpHistory
        .map((event): XpGrant | null => {
          if (!event || typeof event !== "object") return null;
          const e = event as Partial<XpGrant>;
          const kind = typeof e.kind === "string" && e.kind in XP_EVENT_LABELS ? (e.kind as ProgressionEventKind) : null;
          const amount = typeof e.amount === "number" && Number.isFinite(e.amount) && e.amount > 0 ? Math.floor(e.amount) : 0;
          if (!kind || amount <= 0) return null;
          return {
            kind,
            amount,
            label: typeof e.label === "string" && e.label ? e.label : XP_EVENT_LABELS[kind],
            detail: typeof e.detail === "string" && e.detail ? e.detail : undefined,
            at: typeof e.at === "string" && e.at ? e.at : new Date().toISOString(),
          };
        })
        .filter((event): event is XpGrant => Boolean(event))
        .slice(0, XP_HISTORY_LIMIT)
    : [];
  const unlockedRankTitles = Array.isArray(v.unlockedRankTitles)
    ? Array.from(new Set(v.unlockedRankTitles.filter((title): title is string => typeof title === "string" && title.length > 0)))
    : [];
  if (!unlockedRankTitles.includes(rank.title)) unlockedRankTitles.push(rank.title);
  if (!unlockedRankTitles.includes("Beginner")) unlockedRankTitles.unshift("Beginner");

  return {
    xp,
    level,
    rankTitle: rank.title,
    unlockedRankTitles,
    xpHistory,
    totalXpEvents: typeof v.totalXpEvents === "number" && Number.isFinite(v.totalXpEvents) && v.totalXpEvents > 0 ? Math.floor(v.totalXpEvents) : xpHistory.length,
    lastProgressionUpdate: typeof v.lastProgressionUpdate === "string" && v.lastProgressionUpdate ? v.lastProgressionUpdate : null,
  };
}

export function createXpGrant(kind: ProgressionEventKind, at: string, detail?: string, bonus = 0): XpGrant {
  const base = XP_EVENT_AMOUNTS[kind];
  return {
    kind,
    amount: Math.max(0, Math.round(base + bonus)),
    label: XP_EVENT_LABELS[kind],
    detail,
    at,
  };
}

export function applyXpGrant(progression: ProgressionStats, grant: XpGrant): ProgressionStats {
  if (grant.amount <= 0) return normalizeProgressionStats(progression);
  const previous = normalizeProgressionStats(progression);
  const xp = previous.xp + grant.amount;
  const level = getLevelFromXp(xp);
  const rank = getProgressionRank(level);
  const unlockedRankTitles = previous.unlockedRankTitles.includes(rank.title)
    ? previous.unlockedRankTitles
    : [...previous.unlockedRankTitles, rank.title];
  return {
    xp,
    level,
    rankTitle: rank.title,
    unlockedRankTitles,
    xpHistory: [grant, ...previous.xpHistory].slice(0, XP_HISTORY_LIMIT),
    totalXpEvents: previous.totalXpEvents + 1,
    lastProgressionUpdate: grant.at,
  };
}

export function summarizeNextMilestone(progression: ProgressionStats): string {
  const { level, current, needed } = getXpProgress(progression.xp);
  const remaining = Math.max(0, needed - current);
  return remaining === 0 ? `Level ${level + 1} is ready.` : `${remaining} XP to Level ${level + 1}`;
}
