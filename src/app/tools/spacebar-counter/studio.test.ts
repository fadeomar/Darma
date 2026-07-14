import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  SPACEBAR_HISTORY_LIMIT,
  SPACEBAR_IMPORT_MAX_BYTES,
  analyzeSpacebarAttempt,
  buildSpacebarAudit,
  buildSpacebarSummaryCards,
  createSpacebarAttempt,
  createSpacebarBackup,
  createSpacebarProductionPack,
  normalizeSpacebarAttempt,
  parseSpacebarBackup,
  spacebarAttemptCsv,
  spacebarAttemptMarkdown,
  spacebarBackupJson,
  spacebarPackReadme,
} from "./studio";
import type { SpacebarAttempt, SpacebarSample } from "./types";

function samples(
  times = [100, 220, 340, 460, 580, 700, 820, 940, 1060, 1180],
  sources: SpacebarSample["source"][] = [],
) {
  return times.map((time, index): SpacebarSample => ({
    time,
    source: sources[index] ?? "keyboard",
  }));
}

function attempt(overrides: Partial<SpacebarAttempt> = {}): SpacebarAttempt {
  return createSpacebarAttempt({
    id: overrides.id ?? "spacebar-1",
    createdAt: overrides.createdAt ?? "2026-07-14T10:00:00.000Z",
    mode: overrides.mode ?? 10,
    elapsedMs: overrides.elapsedMs ?? 10_000,
    samples: overrides.samples ?? samples(),
    ignoredRepeats: overrides.ignoredRepeats ?? 0,
  });
}

describe("spacebar production studio", () => {
  it("creates an attempt by recomputing stats from press evidence", () => {
    const result = attempt({ ignoredRepeats: 3 });
    expect(result.stats.totalPresses).toBe(10);
    expect(result.stats.pressesPerSecond).toBe(1);
    expect(result.stats.ignoredRepeats).toBe(3);
    expect(result.stats.inputMethod).toBe("Keyboard");
    expect(result.samples).toHaveLength(10);
  });

  it("normalizes timestamps and rejects invalid or non-increasing samples", () => {
    const result = normalizeSpacebarAttempt({
      id: "x",
      createdAt: "bad",
      mode: 5,
      elapsedMs: 5000,
      samples: [
        { time: 100, source: "keyboard" },
        { time: 100, source: "keyboard" },
        { time: -1, source: "keyboard" },
        { time: 200, source: "invalid" },
        { time: 300, source: "touch" },
      ],
      ignoredRepeats: 2,
      stats: {},
    });
    expect(result?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result?.samples).toEqual([
      { time: 100, source: "keyboard" },
      { time: 300, source: "touch" },
    ]);
    expect(result?.stats.inputMethod).toBe("Mixed");
    expect(result?.stats.ignoredRepeats).toBe(2);
  });

  it("preserves legacy aggregate history without samples", () => {
    const result = normalizeSpacebarAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: {
        totalPresses: 80,
        elapsedSeconds: 10,
        pressesPerSecond: 8,
        bestBurst: 10,
        averageGapMs: 125,
        fastestGapMs: 70,
        consistencyScore: 72,
        ignoredRepeats: 4,
        inputMethod: "Keyboard",
      },
    });
    expect(result?.elapsedMs).toBe(10_000);
    expect(result?.stats.pressesPerSecond).toBe(8);
    expect(result?.stats.ignoredRepeats).toBe(4);
    expect(result?.samples).toEqual([]);
  });

  it("creates a versioned backup with normalized settings", () => {
    const backup = createSpacebarBackup(
      { mode: 30 },
      [attempt()],
      "2026-07-14T11:00:00.000Z",
    );
    expect(backup.schema).toBe("darma.spacebar-counter-session");
    expect(backup.version).toBe(1);
    expect(backup.settings).toEqual({ mode: 30 });
    expect(backup.attempts).toHaveLength(1);
  });

  it("limits backup history defensively", () => {
    const attempts = Array.from(
      { length: SPACEBAR_HISTORY_LIMIT + 3 },
      (_, index) => attempt({ id: `spacebar-${index}` }),
    );
    expect(createSpacebarBackup({ mode: 10 }, attempts).attempts).toHaveLength(
      SPACEBAR_HISTORY_LIMIT,
    );
  });

  it("round-trips a valid JSON backup", () => {
    const source = createSpacebarBackup({ mode: "manual" }, [attempt()]);
    const parsed = parseSpacebarBackup(spacebarBackupJson(source));
    expect(parsed.settings.mode).toBe("manual");
    expect(parsed.attempts[0].stats.totalPresses).toBe(10);
  });

  it("rejects malformed JSON and unrelated schemas", () => {
    expect(() => parseSpacebarBackup("{")).toThrow("not valid JSON");
    expect(() =>
      parseSpacebarBackup(
        JSON.stringify({ schema: "other", version: 1, attempts: [] }),
      ),
    ).toThrow("not a Darma Spacebar Counter backup");
  });

  it("rejects unsupported versions and missing attempts", () => {
    expect(() =>
      parseSpacebarBackup(
        JSON.stringify({
          schema: "darma.spacebar-counter-session",
          version: 2,
          attempts: [],
        }),
      ),
    ).toThrow("version is not supported");
    expect(() =>
      parseSpacebarBackup(
        JSON.stringify({
          schema: "darma.spacebar-counter-session",
          version: 1,
        }),
      ),
    ).toThrow("valid attempts array");
  });

  it("rejects duplicate attempt IDs", () => {
    const duplicate = attempt({ id: "same" });
    const backup = createSpacebarBackup({ mode: 10 }, [duplicate, duplicate]);
    expect(() => parseSpacebarBackup(spacebarBackupJson(backup))).toThrow(
      "duplicate attempt IDs",
    );
  });

  it("enforces the one megabyte parser limit", () => {
    expect(() =>
      parseSpacebarBackup("x".repeat(SPACEBAR_IMPORT_MAX_BYTES + 1)),
    ).toThrow("larger than the 1 MB");
  });

  it("assigns strong confidence to a stable timed run", () => {
    const stable = attempt({
      samples: samples(
        Array.from({ length: 50 }, (_, index) => 100 + index * 180),
      ),
    });
    expect(analyzeSpacebarAttempt(stable).confidence).toBe("Strong");
  });

  it("flags sub-twenty-millisecond gaps", () => {
    const result = attempt({
      samples: samples([100, 105, 200, 300, 400, 500, 600, 700, 800, 900]),
    });
    expect(analyzeSpacebarAttempt(result).suspiciousFastGaps).toBe(1);
    expect(buildSpacebarAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "fast-gaps", severity: "warning" }),
      ]),
    );
  });

  it("flags long interrupted gaps", () => {
    const result = attempt({
      samples: samples([
        100, 250, 400, 2050, 2200, 2350, 2500, 2650, 2800, 2950,
      ]),
    });
    expect(analyzeSpacebarAttempt(result).interruptedGaps).toBe(1);
    expect(buildSpacebarAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "interruptions", severity: "warning" }),
      ]),
    );
  });

  it("warns about mixed input paths", () => {
    const result = attempt({
      samples: samples(undefined, [
        "keyboard",
        "touch",
        "keyboard",
        "keyboard",
        "keyboard",
        "keyboard",
        "keyboard",
        "keyboard",
        "keyboard",
        "keyboard",
      ]),
    });
    expect(buildSpacebarAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "input-method", severity: "warning" }),
      ]),
    );
  });

  it("marks a missing run as an export error", () => {
    expect(buildSpacebarAudit(null)[0]).toMatchObject({
      id: "run-missing",
      severity: "error",
    });
  });

  it("warns when only legacy aggregate evidence is available", () => {
    const legacy = normalizeSpacebarAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: { totalPresses: 80, elapsedSeconds: 10, pressesPerSecond: 8 },
    });
    expect(buildSpacebarAudit(legacy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "legacy-evidence", severity: "warning" }),
      ]),
    );
  });

  it("audits ignored hold-repeat events", () => {
    const result = attempt({ ignoredRepeats: 12 });
    expect(buildSpacebarAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "hold-repeats", severity: "warning" }),
      ]),
    );
  });

  it("builds exactly four summary cards", () => {
    const cards = buildSpacebarSummaryCards(attempt());
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual([
      "Press speed",
      "Median gap",
      "Confidence",
      "Input path",
    ]);
  });

  it("exports a CSV row for every recorded press", () => {
    const csv = spacebarAttemptCsv(attempt());
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(11);
    expect(rows[0]).toBe("press_number,time_ms,gap_ms,input_source");
    expect(rows[1]).toBe("1,100,,keyboard");
    expect(rows[2]).toBe("2,220,120,keyboard");
  });

  it("exports a readable Markdown report and disclaimer", () => {
    const markdown = spacebarAttemptMarkdown(attempt({ ignoredRepeats: 2 }));
    expect(markdown).toContain("# Spacebar Counter Test report");
    expect(markdown).toContain("## Per-press evidence");
    expect(markdown).toContain("Ignored hold repeats: 2");
    expect(markdown).toContain("not certified hardware");
  });

  it("creates a useful pack README", () => {
    const readme = spacebarPackReadme(attempt());
    expect(readme).toContain("spacebar-session.json");
    expect(readme).toContain("spacebar-presses.csv");
  });

  it("creates a valid four-file production ZIP", async () => {
    const latest = attempt();
    const backup = createSpacebarBackup({ mode: 10 }, [latest]);
    const bytes = await createSpacebarProductionPack(backup, latest);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual([
      "README.md",
      "spacebar-presses.csv",
      "spacebar-report.md",
      "spacebar-session.json",
    ]);
    const json = JSON.parse(
      await zip.file("spacebar-session.json")!.async("string"),
    );
    expect(json.schema).toBe("darma.spacebar-counter-session");
  });
});
