import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  approximateCollisionProbability,
  buildUuidChecks,
  buildUuidSql,
  buildUuidTypeScript,
  formatUuid,
  generateUuidBatch,
  generateUuidV4,
  generateUuidV7,
  inspectUuid,
  normalizeUuid,
  normalizeUuidCount,
  resetUuidV7StateForTests,
  serializeUuids,
} from "./uuid";

function installDeterministicCrypto() {
  let counter = 0;
  const fakeCrypto = {
    getRandomValues<T extends ArrayBufferView>(array: T): T {
      const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let index = 0; index < bytes.length; index += 1) {
        bytes[index] = (counter + index * 17 + 29) & 0xff;
      }
      counter += bytes.length;
      return array;
    },
  } as Crypto;
  vi.stubGlobal("crypto", fakeCrypto);
}

beforeEach(() => {
  resetUuidV7StateForTests();
  installDeterministicCrypto();
});

describe("UUID generation", () => {
  it("generates RFC-compatible UUID v4 values without randomUUID", () => {
    const value = generateUuidV4();
    const inspection = inspectUuid(value);
    expect(inspection.valid).toBe(true);
    expect(inspection.version).toBe(4);
    expect(inspection.variantCompatible).toBe(true);
  });

  it("generates UUID v7 values with the requested timestamp", () => {
    const timestamp = Date.UTC(2026, 6, 13, 10, 30, 0);
    const value = generateUuidV7(timestamp);
    const inspection = inspectUuid(value);
    expect(inspection.version).toBe(7);
    expect(inspection.timestampMs).toBe(timestamp);
    expect(inspection.variantCompatible).toBe(true);
  });

  it("keeps UUID v7 batches lexicographically ordered inside one millisecond", () => {
    const timestamp = 1_750_000_000_000;
    const values = [generateUuidV7(timestamp), generateUuidV7(timestamp), generateUuidV7(timestamp)];
    expect([...values].sort()).toEqual(values);
    expect(new Set(values).size).toBe(values.length);
  });

  it("generates formatted batches", () => {
    const values = generateUuidBatch(3, "urn", "v4");
    expect(values).toHaveLength(3);
    expect(values.every((value) => value.startsWith("urn:uuid:"))).toBe(true);
  });
});

describe("UUID normalization and inspection", () => {
  const canonical = "018f3f60-4f35-7d2a-8c91-5f4a7c8d9e10";

  it("normalizes compact, URN, and braced forms", () => {
    expect(normalizeUuid(canonical.replaceAll("-", ""))).toBe(canonical);
    expect(normalizeUuid(`urn:uuid:${canonical}`)).toBe(canonical);
    expect(normalizeUuid(`{${canonical.toUpperCase()}}`)).toBe(canonical);
  });

  it("rejects malformed identifiers", () => {
    expect(normalizeUuid("not-a-uuid")).toBeNull();
    expect(inspectUuid("not-a-uuid").valid).toBe(false);
  });

  it("extracts the UUID v7 timestamp", () => {
    const inspection = inspectUuid(canonical);
    expect(inspection.valid).toBe(true);
    expect(inspection.version).toBe(7);
    expect(inspection.timestampIso).not.toBeNull();
  });

  it("recognizes nil and max sentinels", () => {
    expect(inspectUuid("00000000-0000-0000-0000-000000000000").isNil).toBe(true);
    expect(inspectUuid("ffffffff-ffff-ffff-ffff-ffffffffffff").isMax).toBe(true);
  });

  it("formats canonical UUIDs", () => {
    expect(formatUuid(canonical, "uppercase")).toBe(canonical.toUpperCase());
    expect(formatUuid(canonical, "no-hyphens")).toBe(canonical.replaceAll("-", ""));
    expect(formatUuid(canonical, "braces")).toBe(`{${canonical}}`);
  });
});

describe("UUID exports and checks", () => {
  const values = [
    "550e8400-e29b-41d4-a716-446655440000",
    "550e8400-e29b-41d4-a716-446655440001",
  ];

  it("serializes lines, JSON, and CSV", () => {
    expect(serializeUuids(values, "lines")).toContain(values[0]);
    expect(JSON.parse(serializeUuids(values, "json"))).toEqual(values);
    expect(serializeUuids(values, "csv")).toMatch(/^uuid\n/);
  });

  it("builds SQL and TypeScript exports", () => {
    expect(buildUuidSql(values, "users", "id")).toContain("INSERT INTO users (id)");
    expect(buildUuidTypeScript(values, "user ids")).toContain("USER_IDS");
  });

  it("reports duplicate values", () => {
    const config = { version: "v4" as const, count: 2, format: "standard" as const, outputStyle: "lines" as const };
    const checks = buildUuidChecks(config, [values[0], values[0]], inspectUuid(values[0]));
    expect(checks.some((check) => check.id === "duplicates" && check.level === "danger")).toBe(true);
  });

  it("normalizes batch limits and estimates collision probability", () => {
    expect(normalizeUuidCount(0)).toBe(1);
    expect(normalizeUuidCount(1000)).toBe(500);
    expect(approximateCollisionProbability(100, "v4")).toBeGreaterThan(0);
    expect(approximateCollisionProbability(100, "v7")).toBeGreaterThan(approximateCollisionProbability(100, "v4"));
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});
