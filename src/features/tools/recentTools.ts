// Lightweight, account-free history of recently opened tools, kept in
// localStorage on the user's own device. Written from the shared ToolPage
// layout and read by the About page's "Continue where you left off" panel.

export type RecentTool = {
  id: string;
  toolId: string;
  title: string;
  href: string;
  ts: number;
  lastUsedAt: number;
  useCount: number;
};

const STORAGE_KEY = "darma:recent-tools";
export const RECENTS_EVENT = "darma:recent-tools-change";
const MAX_ENTRIES = 10;

function normalizeRecentTool(entry: unknown): RecentTool | null {
  if (!entry || typeof entry !== "object") return null;

  const value = entry as Partial<RecentTool>;
  const toolId = typeof value.toolId === "string" ? value.toolId : typeof value.id === "string" ? value.id : "";
  const title = typeof value.title === "string" ? value.title : "";
  const href = typeof value.href === "string" ? value.href : "";
  if (!toolId || !title || !href) return null;

  const lastUsedAt =
    typeof value.lastUsedAt === "number"
      ? value.lastUsedAt
      : typeof value.ts === "number"
        ? value.ts
        : Date.now();

  return {
    id: toolId,
    toolId,
    title,
    href,
    ts: lastUsedAt,
    lastUsedAt,
    useCount: typeof value.useCount === "number" && value.useCount > 0 ? value.useCount : 1,
  };
}

export function readRecentTools(): RecentTool[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRecentTool)
      .filter((entry): entry is RecentTool => Boolean(entry))
      .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

/** Forget all recently opened tools on this device. */
export function clearRecentTools(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(RECENTS_EVENT));
  } catch {
    // Storage unavailable — nothing to clear.
  }
}

/** Record (or move to front) a tool the user just opened. Most-recent first. */
export function recordRecentTool(entry: { id: string; toolId?: string; title: string; href: string }): void {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const existing = readRecentTools();
    const current = existing.find((tool) => tool.toolId === entry.id || tool.toolId === entry.toolId);
    const rest = existing.filter((tool) => tool.toolId !== (entry.toolId ?? entry.id));
    const next = [
      {
        ...entry,
        id: entry.toolId ?? entry.id,
        toolId: entry.toolId ?? entry.id,
        ts: now,
        lastUsedAt: now,
        useCount: (current?.useCount ?? 0) + 1,
      },
      ...rest,
    ].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENTS_EVENT));
  } catch {
    // Storage unavailable (private mode, quota) — recent history is optional.
  }
}
