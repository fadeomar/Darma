const STORAGE_KEY = "darma:games:chess-mini:local-matches";

export function readChessMatchCount(): number {
  if (typeof window === "undefined") return 0;
  const value = window.localStorage.getItem(STORAGE_KEY);
  const parsed = value ? Number.parseInt(value, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function commitChessMatchStarted(): number {
  if (typeof window === "undefined") return 0;
  const next = readChessMatchCount() + 1;
  window.localStorage.setItem(STORAGE_KEY, String(next));
  return next;
}
