import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  REACTION_HISTORY_LIMIT,
  REACTION_IMPORT_MAX_BYTES,
  analyzeReactionAttempt,
  buildReactionAudit,
  buildReactionSummaryCards,
  createReactionAttempt,
  createReactionBackup,
  createReactionProductionPack,
  normalizeReactionAttempt,
  parseReactionBackup,
  reactionAttemptCsv,
  reactionAttemptMarkdown,
  reactionBackupJson,
  reactionPackReadme,
} from "./studio";
import type { ReactionAttempt, ReactionSample } from "./types";

function samples(
  values = [205, 215, 210, 208, 212],
  sources: ReactionSample["source"][] = [],
) {
  return values.map((reactionMs, index): ReactionSample => ({
    round: index + 1,
    reactionMs,
    waitMs: 1800 + index * 100,
    source: sources[index] ?? "mouse",
  }));
}

function attempt(overrides: Partial<ReactionAttempt> = {}): ReactionAttempt {
  return createReactionAttempt({
    id: overrides.id ?? "reaction-1",
    createdAt: overrides.createdAt ?? "2026-07-14T10:00:00.000Z",
    mode: overrides.mode ?? 5,
    delayProfile: overrides.delayProfile ?? "standard",
    samples: overrides.samples ?? samples(),
    falseStarts: overrides.stats?.falseStarts ?? 0,
  });
}

describe("reaction production studio", () => {
  it("creates an attempt by recomputing stats from round evidence", () => {
    const result = attempt();
    expect(result.stats.roundsCompleted).toBe(5);
    expect(result.stats.averageReactionMs).toBe(210);
    expect(result.stats.medianReactionMs).toBe(210);
    expect(result.stats.inputMethod).toBe("Mouse");
  });

  it("normalizes round numbers and rejects invalid samples", () => {
    const result = normalizeReactionAttempt({
      id: "x",
      createdAt: "bad",
      mode: 3,
      delayProfile: "unknown",
      samples: [
        { round: 99, reactionMs: 220, waitMs: 1500, source: "mouse" },
        { round: 2, reactionMs: -1, waitMs: 1500, source: "mouse" },
        { round: 3, reactionMs: 230, waitMs: 1600, source: "invalid" },
      ],
      stats: { falseStarts: 4 },
    });
    expect(result?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result?.delayProfile).toBe("standard");
    expect(result?.samples).toHaveLength(1);
    expect(result?.samples[0].round).toBe(1);
    expect(result?.stats.falseStarts).toBe(4);
  });

  it("preserves legacy aggregate history when round evidence is unavailable", () => {
    const result = normalizeReactionAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 5,
      stats: {
        roundsCompleted: 5,
        averageReactionMs: 245,
        bestReactionMs: 210,
        slowestReactionMs: 300,
        consistencyScore: 70,
        falseStarts: 1,
        inputMethod: "Keyboard",
      },
    });
    expect(result?.stats.averageReactionMs).toBe(245);
    expect(result?.stats.medianReactionMs).toBe(245);
    expect(result?.stats.spreadReactionMs).toBe(90);
    expect(result?.samples).toEqual([]);
  });

  it("creates a versioned backup with normalized settings", () => {
    const backup = createReactionBackup(
      { mode: 10, delayProfile: "focus" },
      [attempt()],
      "2026-07-14T11:00:00.000Z",
    );
    expect(backup.schema).toBe("darma.reaction-time-session");
    expect(backup.version).toBe(1);
    expect(backup.settings).toEqual({ mode: 10, delayProfile: "focus" });
    expect(backup.attempts).toHaveLength(1);
  });

  it("limits backup history defensively", () => {
    const attempts = Array.from(
      { length: REACTION_HISTORY_LIMIT + 5 },
      (_, index) => attempt({ id: `reaction-${index}` }),
    );
    expect(
      createReactionBackup({ mode: 5, delayProfile: "standard" }, attempts)
        .attempts,
    ).toHaveLength(REACTION_HISTORY_LIMIT);
  });

  it("round-trips a valid JSON backup", () => {
    const source = createReactionBackup({ mode: 5, delayProfile: "standard" }, [
      attempt(),
    ]);
    const parsed = parseReactionBackup(reactionBackupJson(source));
    expect(parsed.settings).toEqual(source.settings);
    expect(parsed.attempts[0].stats.averageReactionMs).toBe(210);
  });

  it("rejects malformed JSON and unrelated schemas", () => {
    expect(() => parseReactionBackup("{")).toThrow("not valid JSON");
    expect(() =>
      parseReactionBackup(
        JSON.stringify({ schema: "other", version: 1, attempts: [] }),
      ),
    ).toThrow("not a Darma Reaction Time backup");
  });

  it("rejects unsupported versions and missing attempt arrays", () => {
    expect(() =>
      parseReactionBackup(
        JSON.stringify({
          schema: "darma.reaction-time-session",
          version: 2,
          attempts: [],
        }),
      ),
    ).toThrow("version is not supported");
    expect(() =>
      parseReactionBackup(
        JSON.stringify({ schema: "darma.reaction-time-session", version: 1 }),
      ),
    ).toThrow("valid attempts array");
  });

  it("rejects duplicate attempt IDs", () => {
    const duplicate = attempt({ id: "same" });
    const backup = createReactionBackup({ mode: 5, delayProfile: "standard" }, [
      duplicate,
      duplicate,
    ]);
    expect(() => parseReactionBackup(reactionBackupJson(backup))).toThrow(
      "duplicate attempt IDs",
    );
  });

  it("enforces the one megabyte parser limit", () => {
    const oversized = "x".repeat(REACTION_IMPORT_MAX_BYTES + 1);
    expect(() => parseReactionBackup(oversized)).toThrow(
      "larger than the 1 MB",
    );
  });

  it("assigns strong confidence to a complete stable run", () => {
    expect(analyzeReactionAttempt(attempt()).confidence).toBe("Strong");
  });

  it("flags suspicious sub-100 ms rounds", () => {
    const result = attempt({ samples: samples([90, 205, 210, 215, 220]) });
    const analysis = analyzeReactionAttempt(result);
    expect(analysis.suspiciousFastRounds).toBe(1);
    expect(buildReactionAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "anticipation", severity: "warning" }),
      ]),
    );
  });

  it("flags interrupted rounds above 1,500 ms", () => {
    const result = attempt({ samples: samples([205, 210, 1600, 215, 220]) });
    expect(analyzeReactionAttempt(result).interruptedRounds).toBe(1);
    expect(buildReactionAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "interruption", severity: "warning" }),
      ]),
    );
  });

  it("warns about mixed input methods", () => {
    const result = attempt({
      samples: samples(
        [205, 210, 215, 220, 225],
        ["mouse", "keyboard", "mouse", "mouse", "mouse"],
      ),
    });
    expect(buildReactionAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "input-method", severity: "warning" }),
      ]),
    );
  });

  it("marks a missing run as an export error", () => {
    expect(buildReactionAudit(null)[0]).toMatchObject({
      id: "run-missing",
      severity: "error",
    });
  });

  it("warns when only legacy aggregate evidence is available", () => {
    const legacy = normalizeReactionAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 5,
      stats: {
        roundsCompleted: 5,
        averageReactionMs: 240,
        bestReactionMs: 200,
      },
    });
    expect(buildReactionAudit(legacy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "legacy-evidence", severity: "warning" }),
      ]),
    );
  });

  it("builds exactly four summary cards", () => {
    const cards = buildReactionSummaryCards(attempt());
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual([
      "Median",
      "Spread",
      "Confidence",
      "Input path",
    ]);
  });

  it("exports a CSV row for every recorded round", () => {
    const csv = reactionAttemptCsv(attempt());
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(6);
    expect(rows[0]).toBe("round,reaction_ms,wait_ms,input_source");
    expect(rows[1]).toBe("1,205,1800,mouse");
  });

  it("exports a readable Markdown report and disclaimer", () => {
    const markdown = reactionAttemptMarkdown(attempt());
    expect(markdown).toContain("# Reaction Time Test report");
    expect(markdown).toContain("## Round evidence");
    expect(markdown).toContain("not medical assessment");
  });

  it("creates a useful pack README", () => {
    const readme = reactionPackReadme(attempt());
    expect(readme).toContain("reaction-session.json");
    expect(readme).toContain("same device");
  });

  it("creates and reopens the complete production ZIP", async () => {
    const latest = attempt();
    const backup = createReactionBackup({ mode: 5, delayProfile: "standard" }, [
      latest,
    ]);
    const archive = await createReactionProductionPack(backup, latest);
    const zip = await JSZip.loadAsync(archive);
    expect(Object.keys(zip.files).sort()).toEqual([
      "README.md",
      "reaction-report.md",
      "reaction-rounds.csv",
      "reaction-session.json",
    ]);
    const json = await zip.file("reaction-session.json")?.async("string");
    expect(parseReactionBackup(json ?? "").attempts).toHaveLength(1);
    expect(await zip.file("reaction-rounds.csv")?.async("string")).toContain(
      "reaction_ms",
    );
  });
});
