import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportProgress, importProgress, readProgress, resetProgress, STORAGE_KEY, writeProgress } from "./neonCoreStorage";
import { PROGRESS_VERSION } from "./neonCoreProgression";

/** Minimal in-memory Storage stand-in (node test env has no localStorage). */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

let store: MemoryStorage;

beforeEach(() => {
  store = new MemoryStorage();
  vi.stubGlobal("window", { localStorage: store });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("corruption safety", () => {
  it("falls back to a clean default on invalid JSON without throwing", () => {
    store.setItem(STORAGE_KEY, "{ this is not json");
    const p = readProgress();
    expect(p.version).toBe(PROGRESS_VERSION);
    expect(p.xp).toBe(0);
    expect(p.currency).toBe(0);
  });

  it("coerces malformed fields to defaults but keeps the valid ones", () => {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: PROGRESS_VERSION, xp: "lots", currency: 250, lifetime: { bestScore: 4000 } }),
    );
    const p = readProgress();
    expect(p.xp).toBe(0); // malformed → default
    expect(p.currency).toBe(250); // valid → kept
    expect(p.lifetime.bestScore).toBe(4000);
  });
});

describe("migrations", () => {
  it("migrates a v1 payload (best score only)", () => {
    store.setItem(STORAGE_KEY, JSON.stringify({ bestScore: 1234 }));
    const p = readProgress();
    expect(p.version).toBe(PROGRESS_VERSION);
    expect(p.lifetime.bestScore).toBe(1234);
    expect(p.settings).toBeDefined();
  });

  it("migrates a v3 payload (bests + tallies) into lifetime stats", () => {
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 3,
        bestScore: 5000,
        bestWave: 12,
        bestCombo: 30,
        weaponUsage: { pulse: 100, rapid: 40, heavy: 10 },
        powerUps: { shield: 3, slowTime: 1, multiShot: 2, explosive: 0 },
        powerUpsCollected: 6,
      }),
    );
    const p = readProgress();
    expect(p.lifetime.bestScore).toBe(5000);
    expect(p.lifetime.bestWave).toBe(12);
    expect(p.lifetime.bestCombo).toBe(30);
    expect(p.lifetime.weaponShots.pulse).toBe(100);
    expect(p.lifetime.totalPowerUps).toBe(6);
  });

  it("round-trips a current payload without loss", () => {
    const original = resetProgress();
    original.currency = 321;
    original.xp = 999;
    writeProgress(original);
    const loaded = readProgress();
    expect(loaded.currency).toBe(321);
    expect(loaded.xp).toBe(999);
  });
});

describe("import / export / reset", () => {
  it("exports valid JSON that imports back to equivalent progress", () => {
    const p = resetProgress();
    p.currency = 500;
    writeProgress(p);
    const text = exportProgress(readProgress());
    const imported = importProgress(text);
    expect(imported).not.toBeNull();
    expect(imported?.currency).toBe(500);
  });

  it("rejects unusable import text", () => {
    expect(importProgress("not json at all")).toBeNull();
  });

  it("reset wipes progress back to defaults", () => {
    const p = resetProgress();
    p.currency = 500;
    writeProgress(p);
    const fresh = resetProgress();
    expect(fresh.currency).toBe(0);
    expect(fresh.xp).toBe(0);
    expect(readProgress().currency).toBe(0);
  });
});
