import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  CLICK_HISTORY_LIMIT,
  CLICK_IMPORT_MAX_BYTES,
  analyzeClickAttempt,
  buildClickAudit,
  buildClickSummaryCards,
  clickAttemptCsv,
  clickAttemptMarkdown,
  clickBackupJson,
  clickPackReadme,
  createClickAttempt,
  createClickBackup,
  createClickProductionPack,
  normalizeClickAttempt,
  parseClickBackup,
} from "./studio";
import type { ClickAttempt, ClickSample } from "./types";

function samples(
  times = [100, 220, 340, 460, 580, 700, 820, 940, 1060, 1180],
  sources: ClickSample["source"][] = [],
) {
  return times.map((time, index): ClickSample => ({
    time,
    source: sources[index] ?? "mouse",
  }));
}

function attempt(overrides: Partial<ClickAttempt> = {}): ClickAttempt {
  return createClickAttempt({
    id: overrides.id ?? "click-1",
    createdAt: overrides.createdAt ?? "2026-07-14T10:00:00.000Z",
    mode: overrides.mode ?? 10,
    elapsedMs: overrides.elapsedMs ?? 10_000,
    samples: overrides.samples ?? samples(),
  });
}

describe("click production studio", () => {
  it("creates an attempt by recomputing stats from click evidence", () => {
    const result = attempt();
    expect(result.stats.totalClicks).toBe(10);
    expect(result.stats.clicksPerSecond).toBe(1);
    expect(result.stats.inputMethod).toBe("Mouse");
    expect(result.samples).toHaveLength(10);
  });

  it("normalizes timestamps and rejects invalid or non-increasing samples", () => {
    const result = normalizeClickAttempt({
      id: "x",
      createdAt: "bad",
      mode: 5,
      elapsedMs: 5000,
      samples: [
        { time: 100, source: "mouse" },
        { time: 100, source: "mouse" },
        { time: -1, source: "mouse" },
        { time: 200, source: "invalid" },
        { time: 300, source: "touch" },
      ],
      stats: {},
    });
    expect(result?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result?.samples).toEqual([
      { time: 100, source: "mouse" },
      { time: 300, source: "touch" },
    ]);
    expect(result?.stats.inputMethod).toBe("Mixed");
  });

  it("preserves legacy aggregate history without samples", () => {
    const result = normalizeClickAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: {
        totalClicks: 80,
        elapsedSeconds: 10,
        clicksPerSecond: 8,
        bestBurst: 10,
        averageGapMs: 125,
        fastestGapMs: 70,
        consistencyScore: 72,
        inputMethod: "Mouse",
      },
    });
    expect(result?.elapsedMs).toBe(10_000);
    expect(result?.stats.clicksPerSecond).toBe(8);
    expect(result?.samples).toEqual([]);
  });

  it("creates a versioned backup with normalized settings", () => {
    const backup = createClickBackup(
      { mode: 30 },
      [attempt()],
      "2026-07-14T11:00:00.000Z",
    );
    expect(backup.schema).toBe("darma.click-speed-session");
    expect(backup.version).toBe(1);
    expect(backup.settings).toEqual({ mode: 30 });
    expect(backup.attempts).toHaveLength(1);
  });

  it("limits backup history defensively", () => {
    const attempts = Array.from(
      { length: CLICK_HISTORY_LIMIT + 3 },
      (_, index) => attempt({ id: `click-${index}` }),
    );
    expect(createClickBackup({ mode: 10 }, attempts).attempts).toHaveLength(
      CLICK_HISTORY_LIMIT,
    );
  });

  it("round-trips a valid JSON backup", () => {
    const source = createClickBackup({ mode: "manual" }, [attempt()]);
    const parsed = parseClickBackup(clickBackupJson(source));
    expect(parsed.settings.mode).toBe("manual");
    expect(parsed.attempts[0].stats.totalClicks).toBe(10);
  });

  it("rejects malformed JSON and unrelated schemas", () => {
    expect(() => parseClickBackup("{")).toThrow("not valid JSON");
    expect(() =>
      parseClickBackup(
        JSON.stringify({ schema: "other", version: 1, attempts: [] }),
      ),
    ).toThrow("not a Darma Click Speed backup");
  });

  it("rejects unsupported versions and missing attempts", () => {
    expect(() =>
      parseClickBackup(
        JSON.stringify({
          schema: "darma.click-speed-session",
          version: 2,
          attempts: [],
        }),
      ),
    ).toThrow("version is not supported");
    expect(() =>
      parseClickBackup(
        JSON.stringify({ schema: "darma.click-speed-session", version: 1 }),
      ),
    ).toThrow("valid attempts array");
  });

  it("rejects duplicate attempt IDs", () => {
    const duplicate = attempt({ id: "same" });
    const backup = createClickBackup({ mode: 10 }, [duplicate, duplicate]);
    expect(() => parseClickBackup(clickBackupJson(backup))).toThrow(
      "duplicate attempt IDs",
    );
  });

  it("enforces the one megabyte parser limit", () => {
    expect(() =>
      parseClickBackup("x".repeat(CLICK_IMPORT_MAX_BYTES + 1)),
    ).toThrow("larger than the 1 MB");
  });

  it("assigns strong confidence to a stable timed run", () => {
    const stable = attempt({
      samples: samples(
        Array.from({ length: 50 }, (_, index) => 100 + index * 180),
      ),
    });
    expect(analyzeClickAttempt(stable).confidence).toBe("Strong");
  });

  it("flags sub-eight-millisecond gaps", () => {
    const result = attempt({
      samples: samples([100, 105, 200, 300, 400, 500, 600, 700, 800, 900]),
    });
    expect(analyzeClickAttempt(result).suspiciousFastGaps).toBe(1);
    expect(buildClickAudit(result)).toEqual(
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
    expect(analyzeClickAttempt(result).interruptedGaps).toBe(1);
    expect(buildClickAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "interruptions", severity: "warning" }),
      ]),
    );
  });

  it("warns about mixed pointer paths", () => {
    const result = attempt({
      samples: samples(undefined, [
        "mouse",
        "touch",
        "mouse",
        "mouse",
        "mouse",
        "mouse",
        "mouse",
        "mouse",
        "mouse",
        "mouse",
      ]),
    });
    expect(buildClickAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "input-method", severity: "warning" }),
      ]),
    );
  });

  it("marks a missing run as an export error", () => {
    expect(buildClickAudit(null)[0]).toMatchObject({
      id: "run-missing",
      severity: "error",
    });
  });

  it("warns when only legacy aggregate evidence is available", () => {
    const legacy = normalizeClickAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: { totalClicks: 80, elapsedSeconds: 10, clicksPerSecond: 8 },
    });
    expect(buildClickAudit(legacy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "legacy-evidence", severity: "warning" }),
      ]),
    );
  });

  it("builds exactly four summary cards", () => {
    const cards = buildClickSummaryCards(attempt());
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual([
      "Click speed",
      "Median gap",
      "Confidence",
      "Input path",
    ]);
  });

  it("exports a CSV row for every recorded click", () => {
    const csv = clickAttemptCsv(attempt());
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(11);
    expect(rows[0]).toBe("click_number,time_ms,gap_ms,input_source");
    expect(rows[1]).toBe("1,100,,mouse");
    expect(rows[2]).toBe("2,220,120,mouse");
  });

  it("exports a readable Markdown report and disclaimer", () => {
    const markdown = clickAttemptMarkdown(attempt());
    expect(markdown).toContain("# Click Speed Test report");
    expect(markdown).toContain("## Per-click evidence");
    expect(markdown).toContain("not certified hardware");
  });

  it("creates a useful pack README", () => {
    const readme = clickPackReadme(attempt());
    expect(readme).toContain("click-session.json");
    expect(readme).toContain("click-events.csv");
  });

  it("creates a valid four-file production ZIP", async () => {
    const latest = attempt();
    const backup = createClickBackup({ mode: 10 }, [latest]);
    const bytes = await createClickProductionPack(backup, latest);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual([
      "README.md",
      "click-events.csv",
      "click-report.md",
      "click-session.json",
    ]);
    const json = JSON.parse(
      await zip.file("click-session.json")!.async("string"),
    );
    expect(json.schema).toBe("darma.click-speed-session");
  });
});
