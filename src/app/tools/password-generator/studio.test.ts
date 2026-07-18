import { describe, expect, it } from "vitest";
import { calculateStrength } from "./generator";
import {
  DEFAULT_PASSWORD_CONFIG,
  buildPasswordAudit,
  buildPasswordEnvExample,
  buildPasswordJavaScriptSnippet,
  buildPasswordMarkdownReport,
  buildPasswordSummary,
  buildPasswordTypeScriptSnippet,
  createPasswordProject,
  normalizePasswordConfig,
  parsePasswordProject,
  summarizePasswordAudit,
} from "./studio";

describe("password studio project files", () => {
  it("round-trips a normalized project without a generated secret", () => {
    const project = createPasswordProject({ ...DEFAULT_PASSWORD_CONFIG, length: 24 }, "important", "2026-07-14T00:00:00.000Z");
    const serialized = JSON.stringify(project);
    const parsed = parsePasswordProject(serialized);

    expect(parsed.policyId).toBe("important");
    expect(parsed.config.length).toBe(24);
    expect(serialized).not.toContain("generatedPassword");
    expect(project.note).toContain("excludes");
  });

  it("rejects invalid schemas and versions", () => {
    expect(() => parsePasswordProject("{}")) .toThrow(/not a Darma/i);
    expect(() => parsePasswordProject(JSON.stringify({ schema: "darma.password-policy", version: 2 }))).toThrow(/version/i);
  });

  it("clamps imported numbers and sanitizes text", () => {
    const normalized = normalizePasswordConfig({ length: 999, wordCount: 1, seedText: `abc\u0000${"x".repeat(100)}` });
    expect(normalized.length).toBe(128);
    expect(normalized.wordCount).toBe(3);
    expect(normalized.seedText).not.toContain("\u0000");
    expect(normalized.seedText.length).toBe(80);
  });
});

describe("password production audit", () => {
  it("passes a strong important-account password", () => {
    const config = { ...DEFAULT_PASSWORD_CONFIG, length: 24 };
    const strength = calculateStrength("x".repeat(24), config);
    const checks = buildPasswordAudit(config, strength, "important", true);
    const counts = summarizePasswordAudit(checks);

    expect(counts.error).toBe(0);
    expect(checks.find((check) => check.id === "entropy")?.severity).toBe("pass");
    expect(checks.find((check) => check.id === "rng")?.severity).toBe("pass");
  });

  it("flags missing secure randomness", () => {
    const strength = calculateStrength("x".repeat(18), DEFAULT_PASSWORD_CONFIG);
    const checks = buildPasswordAudit(DEFAULT_PASSWORD_CONFIG, strength, "standard", false);
    expect(checks.find((check) => check.id === "rng")?.severity).toBe("error");
  });

  it("flags seed text for privileged policies", () => {
    const config = { ...DEFAULT_PASSWORD_CONFIG, length: 28, seedText: "company-name" };
    const strength = calculateStrength("x".repeat(28), config);
    const checks = buildPasswordAudit(config, strength, "privileged", true);
    expect(checks.find((check) => check.id === "seed")?.severity).toBe("error");
  });

  it("rejects passphrase mode for machine secrets", () => {
    const config = { ...DEFAULT_PASSWORD_CONFIG, mode: "passphrase" as const, wordCount: 8 };
    const strength = calculateStrength("word-word-word", config);
    const checks = buildPasswordAudit(config, strength, "machine", true);
    expect(checks.find((check) => check.id === "mode-fit")?.severity).toBe("error");
  });

  it("builds four summary cards", () => {
    const strength = calculateStrength("x".repeat(18), DEFAULT_PASSWORD_CONFIG);
    const checks = buildPasswordAudit(DEFAULT_PASSWORD_CONFIG, strength, "standard", true);
    const cards = buildPasswordSummary(DEFAULT_PASSWORD_CONFIG, strength, "standard", checks);
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual(["Mode", "Estimated entropy", "Target policy", "Readiness"]);
  });
});

describe("safe exports", () => {
  const config = { ...DEFAULT_PASSWORD_CONFIG, length: 24 };
  const strength = calculateStrength("x".repeat(24), config);
  const checks = buildPasswordAudit(config, strength, "important", true);

  it("creates a report that excludes the secret", () => {
    const report = buildPasswordMarkdownReport(config, strength, "important", checks, "2026-07-14T00:00:00.000Z");
    expect(report).toContain("generated password or passphrase is intentionally excluded");
    expect(report).toContain("Production checks");
    expect(report).not.toContain("x".repeat(24));
  });

  it("creates JavaScript and TypeScript policy snippets", () => {
    expect(buildPasswordJavaScriptSnippet(config, "important")).toContain("secureRandomIndex");
    expect(buildPasswordTypeScriptSnippet(config, "important")).toContain("satisfies PasswordPolicyConfig");
  });

  it("creates an empty env template", () => {
    const env = buildPasswordEnvExample("machine");
    expect(env).toContain("APP_SECRET=");
    expect(env).not.toMatch(/APP_SECRET=.+/);
  });
});
