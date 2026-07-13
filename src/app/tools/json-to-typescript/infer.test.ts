import { describe, expect, it } from "vitest";
import {
  analyzeJsonStructure,
  buildProductionChecks,
  generateArtifacts,
  generateJsonSchema,
  generateZodSchema,
  inferTypeScript,
  parseJsonInput,
  sanitizePropertyName,
  toPascalCaseName,
} from "./infer";
import { DEFAULT_OPTIONS } from "./presets";

const options = { ...DEFAULT_OPTIONS, rootName: "ApiResponse" };

describe("JSON contract inference", () => {
  it("reports invalid JSON with a useful parse error", () => {
    const result = parseJsonInput('{"name": }');
    expect(result.ok).toBe(false);
    if ("error" in result) expect(result.error.length).toBeGreaterThan(0);
  });

  it("sanitizes declaration and property names", () => {
    expect(toPascalCaseName("2fa settings")).toBe("Type2faSettings");
    expect(sanitizePropertyName("event-id")).toBe('"event-id"');
    expect(sanitizePropertyName("default")).toBe('"default"');
  });

  it("merges object-array fields and marks missing keys optional", () => {
    const result = inferTypeScript([
      { id: 1, name: "Mira" },
      { id: 2, role: "admin" },
    ], { ...options, rootName: "Users" });

    expect(result.code).toContain("name?: string;");
    expect(result.code).toContain("role?: string;");
    expect(result.code).toContain("type Users = Array<");
    expect(result.declarationCount).toBe(2);
  });

  it("warns when an empty array cannot reveal its item type", () => {
    const result = inferTypeScript({ permissions: [] }, options);
    expect(result.code).toContain("permissions: unknown[];");
    expect(result.warnings.some((warning) => warning.includes("empty array"))).toBe(true);
  });

  it("generates a Zod starter with nullable and optional fields", () => {
    const code = generateZodSchema([
      { id: 1, note: null },
      { id: 2 },
    ], { ...options, rootName: "Rows" });

    expect(code).toContain('import { z } from "zod"');
    expect(code).toContain('"note": z.null().optional()');
    expect(code).toContain("export type Rows = z.infer");
  });

  it("generates JSON Schema with required keys and date-time formats", () => {
    const schema = JSON.parse(generateJsonSchema({
      id: 1,
      createdAt: "2026-07-12T18:42:10Z",
      note: null,
    }, options));

    expect(schema.$schema).toContain("2020-12");
    expect(schema.properties.createdAt.format).toBe("date-time");
    expect(schema.required).toContain("id");
    expect(schema.properties.note.type).toBe("null");
  });

  it("detects mixed arrays, sensitive keys, empty arrays, and unsafe integers", () => {
    const stats = analyzeJsonStructure({
      accessToken: "secret",
      userId: 9007199254740992,
      permissions: [],
      items: [{ id: 1 }, "legacy"],
    });

    expect(stats.sensitivePaths).toContain("$.accessToken");
    expect(stats.longIntegerPaths).toContain("$.userId");
    expect(stats.emptyArrayCount).toBe(1);
    expect(stats.mixedArrayCount).toBe(1);
  });

  it("builds production checks and all export artifacts", () => {
    const value = { id: 1, permissions: [], token: "remove-me" };
    const stats = analyzeJsonStructure(value);
    const checks = buildProductionChecks(stats, 100);
    const artifacts = generateArtifacts(value, 100, options);

    expect(checks.some((check) => check.id === "empty-arrays")).toBe(true);
    expect(checks.some((check) => check.id === "sensitive-keys")).toBe(true);
    expect(artifacts.typescript).toContain("interface ApiResponse");
    expect(artifacts.zod).toContain("ApiResponseSchema");
    expect(artifacts.jsonSchema).toContain('"$schema"');
    expect(JSON.parse(artifacts.report).stats.emptyArrayCount).toBe(1);
  });
});
