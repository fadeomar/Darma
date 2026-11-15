import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreEntity } from "../registry";
import { getRecentCoreEntities, isCoreFavorite, type CoreActivityState } from "./activityStore";

const tool: CoreEntity = { id: "json", slug: "json", kind: "tool", title: "JSON", description: "JSON tool", href: "/tools/json" };
const project: CoreEntity = { id: "p1", slug: "p1", kind: "project", title: "Project", description: "Project", href: "/element/p1" };

const state: CoreActivityState = {
  version: 2,
  favorites: ["tool:json"],
  entities: {
    "tool:json": { id: tool.id, kind: tool.kind, title: tool.title, href: tool.href },
    "project:p1": { id: project.id, kind: project.kind, title: project.title, href: project.href },
  },
  events: [
    { entityId: "p1", entityKind: "project", type: "view", at: 20 },
    { entityId: "json", entityKind: "tool", type: "open", at: 10 },
    { entityId: "p1", entityKind: "project", type: "open", at: 5 },
  ],
};

describe("core activity helpers", () => {
  it("deduplicates recents by entity and preserves recency", () => {
    expect(getRecentCoreEntities(state).map((item) => item.id)).toEqual(["p1", "json"]);
  });

  it("filters recents by kind", () => {
    expect(getRecentCoreEntities(state, 12, ["tool"]).map((item) => item.id)).toEqual(["json"]);
  });

  it("resolves favorites by kind + id key", () => {
    expect(isCoreFavorite(state, tool)).toBe(true);
    expect(isCoreFavorite(state, project)).toBe(false);
  });
});

const game: CoreEntity = { id: "g1", slug: "game-one", kind: "game", title: "Game one", description: "Game", href: "/games/game-one" };
const otherGame: CoreEntity = { ...game, id: "g2", slug: "game-two", href: "/games/game-two" };
const legacyKey = "darma:games:activity:v1";

async function createStore(values: Record<string, string> = {}) {
  vi.resetModules();
  const data = new Map(Object.entries(values));
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
  vi.stubGlobal("window", { localStorage: storage, addEventListener: vi.fn() });
  return { store: await import("./activityStore"), data, storage };
}

afterEach(() => vi.unstubAllGlobals());

describe("activity persistence and legacy migration", () => {
  it("preserves lifetime play counts including games outside the recent list", async () => {
    const { store } = await createStore({ [legacyKey]: JSON.stringify({
      favorites: [game.slug], recentlyPlayed: [game.slug],
      playCounts: { [game.slug]: 250, [otherGame.slug]: 40 },
      lastPlayedAt: { [game.slug]: "2026-01-02T00:00:00Z", [otherGame.slug]: "2026-01-01T00:00:00Z" },
    }) });
    store.migrateLegacyCoreActivity([game, otherGame]);
    expect(store.getCoreActivitySnapshot().playCounts).toEqual({ "game:g1": 250, "game:g2": 40 });
    store.recordCoreActivity(store.toCoreActivityRef(game), "play");
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(251);
  });

  it("does not restore cleared games after migration, a reload, or another migration", async () => {
    const { store, data } = await createStore({ [legacyKey]: JSON.stringify({ favorites: [game.slug], recentlyPlayed: [game.slug], playCounts: { [game.slug]: 25 } }) });
    store.migrateLegacyCoreActivity([game, tool]);
    store.recordCoreActivity(store.toCoreActivityRef(tool), "open");
    store.clearCoreActivityKinds(["game"]);
    // Even an old tab restoring the legacy key must not reimport the history.
    data.set(legacyKey, JSON.stringify({ favorites: [game.slug], playCounts: { [game.slug]: 25 } }));
    const reloaded = await createStore(Object.fromEntries(data));
    reloaded.store.migrateLegacyCoreActivity([game, tool]);
    const next = reloaded.store.getCoreActivitySnapshot();
    expect(next.favorites).toEqual([]);
    expect(next.playCounts).toEqual({});
    expect(next.events.map((event) => event.entityKind)).toEqual(["tool"]);
  });

  it("migrates games when the new store already contains unrelated activity", async () => {
    const { store } = await createStore({ [legacyKey]: JSON.stringify({ playCounts: { [game.slug]: 25 } }) });
    store.recordCoreActivity(store.toCoreActivityRef(tool), "open");
    store.migrateLegacyCoreActivity([game, tool]);
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(25);
    expect(store.getCoreActivitySnapshot().events.some((event) => event.entityId === tool.id)).toBe(true);
    store.migrateLegacyCoreActivity([game, tool]);
    expect(store.getCoreActivitySnapshot().events.filter((event) => event.entityKind === "game")).toHaveLength(1);
  });

  it("keeps cumulative counts when the rolling event history is trimmed", async () => {
    const { store } = await createStore();
    for (let i = 0; i < 220; i++) store.recordCoreActivity(store.toCoreActivityRef(game), "play", i * 31_000);
    expect(store.getCoreActivitySnapshot().events).toHaveLength(180);
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(220);
  });

  it("derives counts for a v2 store that predates cumulative counters", async () => {
    const { store } = await createStore({ "darma:core:activity:v2": JSON.stringify({ ...state, events: [
      { entityId: game.id, entityKind: "game", type: "play", at: 2 },
      { entityId: game.id, entityKind: "game", type: "play", at: 1 },
    ] }) });
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(2);
  });

  it("keeps the UI usable when the localStorage getter throws", async () => {
    const { store } = await createStore();
    Object.defineProperty(window, "localStorage", { get() { throw new Error("SecurityError"); } });
    expect(() => {
      store.getCoreActivitySnapshot();
      store.subscribeCoreActivity(() => {});
      store.migrateLegacyCoreActivity([game]);
      store.toggleCoreFavorite(store.toCoreActivityRef(game));
      store.recordCoreActivity(store.toCoreActivityRef(game), "play");
      store.clearCoreActivityKinds(["game"]);
    }).not.toThrow();
  });

  it("keeps in-memory activity when storage is full", async () => {
    const { store, storage } = await createStore();
    storage.setItem = () => { throw new Error("QuotaExceededError"); };
    store.recordCoreActivity(store.toCoreActivityRef(game), "play");
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(1);
  });

  it("handles malformed legacy payloads and invalid counts", async () => {
    const { store } = await createStore({
      "darma:global-search:recent-items": "null",
      [legacyKey]: JSON.stringify({ favorites: 42, recentlyPlayed: {}, playCounts: { [game.slug]: -20 } }),
    });
    expect(() => store.migrateLegacyCoreActivity([game])).not.toThrow();
    expect(store.getCoreActivitySnapshot().playCounts?.["game:g1"]).toBe(1);
  });
});
