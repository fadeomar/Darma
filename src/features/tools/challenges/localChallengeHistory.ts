export function loadChallengeHistory<TAttempt>(key: string, normalize: (value: unknown) => TAttempt | null, limit = 5): TAttempt[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalize).filter(Boolean).slice(0, limit) as TAttempt[];
  } catch {
    return [];
  }
}

export function loadChallengeHistoryWithFallback<TAttempt>({
  key,
  fallbackKeys = [],
  normalize,
  limit = 5,
}: {
  key: string;
  fallbackKeys?: string[];
  normalize: (value: unknown) => TAttempt | null;
  limit?: number;
}): TAttempt[] {
  const keys = [key, ...fallbackKeys];

  for (const storageKey of keys) {
    const history = loadChallengeHistory(storageKey, normalize, limit);
    if (history.length) return history;
  }

  return [];
}

export function saveChallengeHistory<TAttempt>(key: string, history: TAttempt[], limit = 5) {
  try {
    window.localStorage.setItem(key, JSON.stringify(history.slice(0, limit)));
  } catch {
    // Challenge history is optional. The tool should still work when storage is unavailable.
  }
}
