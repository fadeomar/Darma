import type { CoreEntity, CoreEntityKind } from "../registry";
import type { CoreActivityEventType } from "./personalization";

export const CORE_ACTIVITY_STORAGE_KEY = "darma:core:activity:v2";
const LEGACY_SEARCH_RECENTS_KEY = "darma:global-search:recent-items";
const LEGACY_GAMES_ACTIVITY_KEY = "darma:games:activity:v1";
const MAX_EVENTS = 180;
const MAX_FAVORITES = 80;
const DUPLICATE_WINDOW_MS = 30_000;

export type CoreActivityEntityRef = Pick<CoreEntity, "id" | "kind" | "title" | "href"> & {
  description?: string;
};

export type StoredCoreActivityEvent = {
  entityId: string;
  entityKind: CoreEntityKind;
  type: CoreActivityEventType;
  at: number;
};

export type CoreActivityState = {
  version: 2;
  events: StoredCoreActivityEvent[];
  favorites: string[];
  entities: Record<string, CoreActivityEntityRef>;
};

const EMPTY_STATE: CoreActivityState = { version: 2, events: [], favorites: [], entities: {} };
let memoryState: CoreActivityState = EMPTY_STATE;
let hydrated = false;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function entityKey(entity: Pick<CoreActivityEntityRef, "kind" | "id">) {
  return `${entity.kind}:${entity.id}`;
}

function normalizeRef(value: unknown): CoreActivityEntityRef | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CoreActivityEntityRef>;
  if (!item.id || !item.kind || !item.title || !item.href) return null;
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    href: item.href,
    ...(item.description ? { description: item.description } : {}),
  };
}

function normalizeState(value: unknown): CoreActivityState {
  if (!value || typeof value !== "object") return EMPTY_STATE;
  const candidate = value as Partial<CoreActivityState>;
  const entities = Object.fromEntries(
    Object.entries(candidate.entities ?? {})
      .map(([key, ref]) => [key, normalizeRef(ref)] as const)
      .filter((entry): entry is readonly [string, CoreActivityEntityRef] => Boolean(entry[1])),
  );
  const events = Array.isArray(candidate.events)
    ? candidate.events
        .filter((event): event is StoredCoreActivityEvent => {
          if (!event || typeof event !== "object") return false;
          const item = event as StoredCoreActivityEvent;
          return Boolean(item.entityId && item.entityKind && item.type && Number.isFinite(item.at));
        })
        .sort((a, b) => b.at - a.at)
        .slice(0, MAX_EVENTS)
    : [];
  const favorites = Array.from(
    new Set(Array.isArray(candidate.favorites) ? candidate.favorites.filter((item): item is string => typeof item === "string") : []),
  ).slice(0, MAX_FAVORITES);
  return { version: 2, events, favorites, entities };
}

function readState() {
  if (!canUseStorage()) return memoryState;
  try {
    return normalizeState(JSON.parse(window.localStorage.getItem(CORE_ACTIVITY_STORAGE_KEY) ?? "null"));
  } catch {
    return EMPTY_STATE;
  }
}

function persist(next: CoreActivityState) {
  memoryState = normalizeState(next);
  hydrated = true;
  if (canUseStorage()) {
    try {
      window.localStorage.setItem(CORE_ACTIVITY_STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      // Activity persistence is optional; the UI must remain usable when storage is unavailable.
    }
  }
  listeners.forEach((listener) => listener());
}

function ensureHydrated() {
  if (hydrated) return;
  memoryState = readState();
  hydrated = true;
}

export function toCoreActivityRef(entity: CoreEntity): CoreActivityEntityRef {
  return { id: entity.id, kind: entity.kind, title: entity.title, href: entity.href, description: entity.description };
}

export function getCoreActivitySnapshot(): CoreActivityState {
  ensureHydrated();
  return memoryState;
}

export const getCoreActivityServerSnapshot = (): CoreActivityState => EMPTY_STATE;

/*
 * Cross-tab sync, preserving the behaviour the games activity hook had before
 * it moved onto this store: a write in one tab refreshes the others.
 */
let storageListenerAttached = false;

function attachStorageListener() {
  if (storageListenerAttached || !canUseStorage()) return;
  storageListenerAttached = true;
  window.addEventListener("storage", (event) => {
    if (event.key !== CORE_ACTIVITY_STORAGE_KEY) return;
    memoryState = readState();
    hydrated = true;
    listeners.forEach((listener) => listener());
  });
}

export function subscribeCoreActivity(listener: () => void) {
  attachStorageListener();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function recordCoreActivity(entity: CoreActivityEntityRef, type: CoreActivityEventType, at = Date.now()) {
  ensureHydrated();
  const key = entityKey(entity);
  const latest = memoryState.events.find((event) => event.entityId === entity.id && event.entityKind === entity.kind && event.type === type);
  const dedupe = latest && at - latest.at < DUPLICATE_WINDOW_MS;
  const events = dedupe
    ? memoryState.events
    : [{ entityId: entity.id, entityKind: entity.kind, type, at }, ...memoryState.events].slice(0, MAX_EVENTS);
  persist({ ...memoryState, events, entities: { ...memoryState.entities, [key]: entity } });
}

export function toggleCoreFavorite(entity: CoreActivityEntityRef) {
  ensureHydrated();
  const key = entityKey(entity);
  const current = new Set(memoryState.favorites);
  if (current.has(key)) current.delete(key);
  else current.add(key);
  persist({
    ...memoryState,
    favorites: [...current].slice(0, MAX_FAVORITES),
    entities: { ...memoryState.entities, [key]: entity },
  });
}

export function isCoreFavorite(state: CoreActivityState, entity: Pick<CoreActivityEntityRef, "kind" | "id">) {
  return state.favorites.includes(entityKey(entity));
}

export function getRecentCoreEntities(state: CoreActivityState, limit = 12, kinds?: readonly CoreEntityKind[]) {
  const allowed = kinds ? new Set(kinds) : null;
  const seen = new Set<string>();
  const result: CoreActivityEntityRef[] = [];
  for (const event of [...state.events].sort((a, b) => b.at - a.at)) {
    const key = `${event.entityKind}:${event.entityId}`;
    if (seen.has(key) || (allowed && !allowed.has(event.entityKind))) continue;
    const entity = state.entities[key];
    if (!entity) continue;
    seen.add(key);
    result.push(entity);
    if (result.length >= limit) break;
  }
  return result;
}

export function clearCoreActivityKinds(kinds: readonly CoreEntityKind[]) {
  ensureHydrated();
  const removed = new Set(kinds);
  const entities = Object.fromEntries(Object.entries(memoryState.entities).filter(([, entity]) => !removed.has(entity.kind)));
  const favorites = memoryState.favorites.filter((key) => {
    const entity = memoryState.entities[key];
    return !entity || !removed.has(entity.kind);
  });
  persist({ ...memoryState, events: memoryState.events.filter((event) => !removed.has(event.entityKind)), favorites, entities });
}

export function migrateLegacyCoreActivity(entities: readonly CoreEntity[]) {
  if (!canUseStorage()) return;
  ensureHydrated();
  if (memoryState.events.length || memoryState.favorites.length) return;
  const byHref = new Map(entities.map((entity) => [entity.href, entity]));
  const gamesBySlug = new Map(entities.filter((entity) => entity.kind === "game").map((entity) => [entity.slug, entity]));
  let next = memoryState;
  try {
    const recent = JSON.parse(window.localStorage.getItem(LEGACY_SEARCH_RECENTS_KEY) ?? "[]") as Array<{ href?: string; visitedAt?: number }>;
    for (const item of recent) {
      const entity = item.href ? byHref.get(item.href) : undefined;
      if (!entity) continue;
      const ref = toCoreActivityRef(entity);
      const key = entityKey(ref);
      next = {
        ...next,
        events: [{ entityId: ref.id, entityKind: ref.kind, type: "open", at: item.visitedAt ?? Date.now() }, ...next.events],
        entities: { ...next.entities, [key]: ref },
      };
    }
  } catch {}
  try {
    const legacy = JSON.parse(window.localStorage.getItem(LEGACY_GAMES_ACTIVITY_KEY) ?? "null") as null | {
      favorites?: string[];
      recentlyPlayed?: string[];
      lastPlayedAt?: Record<string, string>;
    };
    for (const slug of legacy?.favorites ?? []) {
      const entity = gamesBySlug.get(slug);
      if (!entity) continue;
      const ref = toCoreActivityRef(entity);
      const key = entityKey(ref);
      next = { ...next, favorites: [...new Set([...next.favorites, key])], entities: { ...next.entities, [key]: ref } };
    }
    for (const slug of legacy?.recentlyPlayed ?? []) {
      const entity = gamesBySlug.get(slug);
      if (!entity) continue;
      const ref = toCoreActivityRef(entity);
      const key = entityKey(ref);
      const parsedAt = Date.parse(legacy?.lastPlayedAt?.[slug] ?? "");
      next = {
        ...next,
        events: [{ entityId: ref.id, entityKind: ref.kind, type: "play", at: Number.isFinite(parsedAt) ? parsedAt : Date.now() }, ...next.events],
        entities: { ...next.entities, [key]: ref },
      };
    }
  } catch {}
  persist(normalizeState(next));
}
