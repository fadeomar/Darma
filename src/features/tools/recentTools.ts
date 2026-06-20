// Lightweight, account-free history of recently opened tools, kept in
// localStorage on the user's own device. Written from the shared ToolPage
// layout and read by the About page's "Continue where you left off" panel.

export type RecentTool = {
  id: string;
  title: string;
  href: string;
  ts: number;
};

const STORAGE_KEY = "darma:recent-tools";
const MAX_ENTRIES = 8;

export function readRecentTools(): RecentTool[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentTool =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as RecentTool).id === "string" &&
        typeof (entry as RecentTool).title === "string" &&
        typeof (entry as RecentTool).href === "string",
    );
  } catch {
    return [];
  }
}

/** Record (or move to front) a tool the user just opened. Most-recent first. */
export function recordRecentTool(entry: Omit<RecentTool, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readRecentTools().filter((tool) => tool.id !== entry.id);
    const next = [{ ...entry, ts: Date.now() }, ...existing].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota) — recent history is optional.
  }
}
