import { describe, expect, it } from "vitest";
import { annotatePassword, calculateStrength, generatePassword, generatePassphrase } from "./generator";
import type { PasswordConfig } from "./types";

const baseConfig: PasswordConfig = {
  mode: "password",
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
  excludeSimilar: false,
  excludeAmbiguous: false,
  wordCount: 4,
  separator: "-",
  capitalizeWords: false,
  includeNumber: false,
  includeSymbol: false,
  seedText: "",
};

// ─── generatePassword ─────────────────────────────────────────────────────────

describe("generatePassword", () => {
  it("returns a string of the requested length", () => {
    const pw = generatePassword({ ...baseConfig, length: 20 });
    expect(pw).toHaveLength(20);
  });

  it("contains only lowercase when only lowercase is enabled", () => {
    const pw = generatePassword({ ...baseConfig, uppercase: false, numbers: false, length: 40 });
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it("returns empty string when no character set is enabled and no seed", () => {
    const pw = generatePassword({ ...baseConfig, uppercase: false, lowercase: false, numbers: false, symbols: false });
    expect(pw).toBe("");
  });

  it("excludes similar characters when excludeSimilar is true", () => {
    const similar = new Set(["l","1","I","O","0","o","S","5","Z","2","G","6","B","8"]);
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...baseConfig, length: 32, excludeSimilar: true });
      for (const char of pw) {
        expect(similar.has(char)).toBe(false);
      }
    }
  });

  it("always includes at least one digit when numbers are enabled (runs 20 times)", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...baseConfig, length: 16, numbers: true });
      expect(/[0-9]/.test(pw)).toBe(true);
    }
  });

  it("always includes at least one uppercase when uppercase is enabled (runs 20 times)", () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword({ ...baseConfig, length: 16, uppercase: true });
      expect(/[A-Z]/.test(pw)).toBe(true);
    }
  });

  it("respects the requested length even when all sets are enabled", () => {
    const pw = generatePassword({ ...baseConfig, symbols: true, length: 24 });
    expect(pw).toHaveLength(24);
  });
});

// ─── generatePassphrase ───────────────────────────────────────────────────────

describe("generatePassphrase", () => {
  it("returns words joined by the given separator", () => {
    const pp = generatePassphrase({ ...baseConfig, mode: "passphrase", wordCount: 4, separator: "-" });
    const parts = pp.split("-");
    expect(parts.length).toBeGreaterThanOrEqual(4);
  });

  it("capitalizes words when capitalizeWords is true", () => {
    for (let i = 0; i < 10; i++) {
      const pp = generatePassphrase({ ...baseConfig, mode: "passphrase", wordCount: 4, separator: "-", capitalizeWords: true });
      pp.split("-").forEach((word) => {
        if (/^[a-zA-Z]/.test(word)) {
          expect(word.charAt(0)).toEqual(word.charAt(0).toUpperCase());
        }
      });
    }
  });

  it("includes a number segment when includeNumber is true", () => {
    const pp = generatePassphrase({ ...baseConfig, mode: "passphrase", wordCount: 4, separator: "-", includeNumber: true });
    expect(/\d+/.test(pp)).toBe(true);
  });
});

// ─── calculateStrength ────────────────────────────────────────────────────────

describe("calculateStrength", () => {
  it("returns very-weak for empty password", () => {
    const result = calculateStrength("", baseConfig);
    expect(result.level).toBe("very-weak");
    expect(result.entropy).toBe(0);
  });

  it("returns very-strong for all-sets long password", () => {
    const config: PasswordConfig = { ...baseConfig, length: 32, symbols: true };
    const result = calculateStrength("x".repeat(32), config);
    expect(result.level).toBe("very-strong");
    expect(result.entropy).toBeGreaterThan(80);
  });

  it("returns weak for short lowercase-only password", () => {
    const config: PasswordConfig = { ...baseConfig, length: 6, uppercase: false, numbers: false };
    const result = calculateStrength("abcdef", config);
    expect(["very-weak", "weak"]).toContain(result.level);
  });

  it("crack time is a non-empty string", () => {
    const result = calculateStrength("somepassword", baseConfig);
    expect(typeof result.crackTime).toBe("string");
    expect(result.crackTime.length).toBeGreaterThan(0);
  });

  it("score is between 0 and 100", () => {
    const result = calculateStrength("somepassword", baseConfig);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─── annotatePassword ─────────────────────────────────────────────────────────

describe("annotatePassword", () => {
  it("annotates lowercase letters correctly", () => {
    const result = annotatePassword("abc");
    expect(result.every((c) => c.type === "lower")).toBe(true);
  });

  it("annotates uppercase letters correctly", () => {
    const result = annotatePassword("ABC");
    expect(result.every((c) => c.type === "upper")).toBe(true);
  });

  it("annotates digits correctly", () => {
    const result = annotatePassword("123");
    expect(result.every((c) => c.type === "digit")).toBe(true);
  });

  it("annotates symbols correctly", () => {
    const result = annotatePassword("!@#");
    expect(result.every((c) => c.type === "symbol")).toBe(true);
  });

  it("preserves character order", () => {
    const result = annotatePassword("aB3!");
    expect(result.map((c) => c.char).join("")).toBe("aB3!");
    expect(result[0].type).toBe("lower");
    expect(result[1].type).toBe("upper");
    expect(result[2].type).toBe("digit");
    expect(result[3].type).toBe("symbol");
  });

  it("returns empty array for empty string", () => {
    expect(annotatePassword("")).toEqual([]);
  });
});
