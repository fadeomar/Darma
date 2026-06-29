import type { DarmaGameStorageAdapter } from "./gameEngineTypes";

type CreateLocalJsonStoreOptions<TState> = {
  key: string;
  version: number;
  defaultState: TState;
  migrate?: (raw: unknown) => TState;
  onError?: (message: string, error?: unknown) => void;
};

function cloneDefault<TState>(state: TState): TState {
  if (typeof structuredClone === "function") return structuredClone(state);
  return JSON.parse(JSON.stringify(state)) as TState;
}

function storageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const probe = "__darma_game_engine_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Small local JSON store for future games.
 *
 * Reaction Timer Pro still owns its battle-tested storage because it has a large
 * schema. This adapter is the reusable starting point for the next Darma games.
 */
export function createLocalJsonStore<TState>({
  key,
  version,
  defaultState,
  migrate,
  onError,
}: CreateLocalJsonStoreOptions<TState>): DarmaGameStorageAdapter<TState> {
  const safeDefault = () => cloneDefault(defaultState);

  return {
    key,
    version,
    read() {
      if (!storageAvailable()) return safeDefault();
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return safeDefault();
        const parsed = JSON.parse(raw) as unknown;
        return migrate ? migrate(parsed) : (parsed as TState);
      } catch (error) {
        onError?.("Could not read local game storage; falling back to defaults.", error);
        return safeDefault();
      }
    },
    write(state) {
      if (!storageAvailable()) return false;
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
        return true;
      } catch (error) {
        onError?.("Could not save local game storage.", error);
        return false;
      }
    },
    reset() {
      if (!storageAvailable()) return false;
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (error) {
        onError?.("Could not reset local game storage.", error);
        return false;
      }
    },
  };
}
