import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  SCROLL_HISTORY_LIMIT,
  SCROLL_IMPORT_MAX_BYTES,
  analyzeScrollAttempt,
  buildScrollAudit,
  buildScrollSummaryCards,
  createScrollAttempt,
  createScrollBackup,
  createScrollProductionPack,
  normalizeScrollAttempt,
  parseScrollBackup,
  scrollAttemptCsv,
  scrollAttemptMarkdown,
  scrollBackupJson,
  scrollPackReadme,
} from "./studio";
import type { ScrollAttempt, ScrollSample } from "./types";

function samples(
  times = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200],
  sources: ScrollSample["source"][] = [],
): ScrollSample[] {
  return times.map((time, index) => ({
    time,
    dx: 0,
    dy: 120,
    source: sources[index] ?? "wheel",
  }));
}

function attempt(overrides: Partial<ScrollAttempt> = {}): ScrollAttempt {
  return createScrollAttempt({
    id: overrides.id ?? "scroll-1",
    createdAt: overrides.createdAt ?? "2026-07-14T10:00:00.000Z",
    mode: overrides.mode ?? 10,
    elapsedMs: overrides.elapsedMs ?? 10_000,
    samples: overrides.samples ?? samples(),
  });
}

describe("mouse scroll production studio", () => {
  it("creates an attempt by recomputing stats from event evidence", () => {
    const result = attempt();
    expect(result.stats.eventsCount).toBe(12);
    expect(result.stats.totalDistance).toBe(1440);
    expect(result.stats.inputMethod).toBe("Wheel");
    expect(result.samples).toHaveLength(12);
  });

  it("normalizes samples and rejects invalid or non-increasing events", () => {
    const result = normalizeScrollAttempt({
      id: "x",
      createdAt: "bad",
      mode: 5,
      elapsedMs: 5000,
      samples: [
        { time: 100, dx: 0, dy: 10, source: "wheel" },
        { time: 100, dx: 0, dy: 20, source: "wheel" },
        { time: -1, dx: 0, dy: 10, source: "wheel" },
        { time: 200, dx: 0, dy: 10, source: "invalid" },
        { time: 300, dx: 20, dy: 0, source: "touch" },
      ],
      stats: {},
    });
    expect(result?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(result?.samples).toEqual([
      { time: 100, dx: 0, dy: 10, source: "wheel" },
      { time: 300, dx: 20, dy: 0, source: "touch" },
    ]);
    expect(result?.stats.inputMethod).toBe("Mixed");
  });

  it("preserves legacy aggregate history without event samples", () => {
    const result = normalizeScrollAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: {
        totalDistance: 5000,
        elapsedSeconds: 10,
        pixelsPerSecond: 500,
        eventsCount: 40,
        inputMethod: "Wheel",
      },
    });
    expect(result?.elapsedMs).toBe(10_000);
    expect(result?.stats.pixelsPerSecond).toBe(500);
    expect(result?.samples).toEqual([]);
  });

  it("creates a versioned backup with normalized settings", () => {
    const backup = createScrollBackup(
      { mode: 30 },
      [attempt()],
      "2026-07-14T11:00:00.000Z",
    );
    expect(backup.schema).toBe("darma.mouse-scroll-session");
    expect(backup.version).toBe(1);
    expect(backup.settings).toEqual({ mode: 30 });
    expect(backup.attempts).toHaveLength(1);
  });

  it("limits backup history defensively", () => {
    const attempts = Array.from(
      { length: SCROLL_HISTORY_LIMIT + 3 },
      (_, index) => attempt({ id: `scroll-${index}` }),
    );
    expect(createScrollBackup({ mode: 10 }, attempts).attempts).toHaveLength(
      SCROLL_HISTORY_LIMIT,
    );
  });

  it("round-trips a valid JSON backup", () => {
    const source = createScrollBackup({ mode: "manual" }, [attempt()]);
    const parsed = parseScrollBackup(scrollBackupJson(source));
    expect(parsed.settings.mode).toBe("manual");
    expect(parsed.attempts[0].stats.eventsCount).toBe(12);
  });

  it("rejects malformed JSON and unrelated schemas", () => {
    expect(() => parseScrollBackup("{")).toThrow("not valid JSON");
    expect(() =>
      parseScrollBackup(
        JSON.stringify({ schema: "other", version: 1, attempts: [] }),
      ),
    ).toThrow("not a Darma Mouse Scroll backup");
  });

  it("rejects unsupported versions and missing attempts", () => {
    expect(() =>
      parseScrollBackup(
        JSON.stringify({
          schema: "darma.mouse-scroll-session",
          version: 2,
          attempts: [],
        }),
      ),
    ).toThrow("version is not supported");
    expect(() =>
      parseScrollBackup(
        JSON.stringify({ schema: "darma.mouse-scroll-session", version: 1 }),
      ),
    ).toThrow("valid attempts array");
  });

  it("rejects duplicate attempt IDs", () => {
    const duplicate = attempt({ id: "same" });
    const backup = createScrollBackup({ mode: 10 }, [duplicate, duplicate]);
    expect(() => parseScrollBackup(scrollBackupJson(backup))).toThrow(
      "duplicate attempt IDs",
    );
  });

  it("enforces the one megabyte parser limit", () => {
    expect(() =>
      parseScrollBackup("x".repeat(SCROLL_IMPORT_MAX_BYTES + 1)),
    ).toThrow("larger than the 1 MB");
  });

  it("assigns strong confidence to a stable timed run", () => {
    const stable = attempt({
      samples: samples(Array.from({ length: 40 }, (_, index) => 100 + index * 180)),
    });
    expect(analyzeScrollAttempt(stable).confidence).toBe("Strong");
  });

  it("flags extreme movement deltas", () => {
    const result = attempt({
      samples: [
        ...samples().slice(0, 11),
        { time: 1300, dx: 0, dy: 20_000, source: "wheel" },
      ],
    });
    expect(analyzeScrollAttempt(result).extremeDeltaEvents).toBe(1);
    expect(buildScrollAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "extreme-deltas", severity: "warning" }),
      ]),
    );
  });

  it("flags long interrupted gaps", () => {
    const result = attempt({
      samples: samples([100, 200, 300, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800]),
    });
    expect(analyzeScrollAttempt(result).interruptedGaps).toBe(1);
    expect(buildScrollAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "interruptions", severity: "warning" }),
      ]),
    );
  });

  it("warns about mixed input paths", () => {
    const result = attempt({
      samples: samples(undefined, [
        "wheel", "touch", "wheel", "wheel", "wheel", "wheel",
        "wheel", "wheel", "wheel", "wheel", "wheel", "wheel",
      ]),
    });
    expect(buildScrollAudit(result)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "input-method", severity: "warning" }),
      ]),
    );
  });

  it("marks a missing run as an export error", () => {
    expect(buildScrollAudit(null)[0]).toMatchObject({
      id: "run-missing",
      severity: "error",
    });
  });

  it("warns when only legacy aggregate evidence is available", () => {
    const legacy = normalizeScrollAttempt({
      id: "legacy",
      createdAt: "2026-01-01T00:00:00.000Z",
      mode: 10,
      stats: { totalDistance: 5000, elapsedSeconds: 10, pixelsPerSecond: 500, eventsCount: 40 },
    });
    expect(buildScrollAudit(legacy)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "legacy-evidence", severity: "warning" }),
      ]),
    );
  });

  it("builds exactly four summary cards", () => {
    const cards = buildScrollSummaryCards(attempt());
    expect(cards).toHaveLength(4);
    expect(cards.map((card) => card.label)).toEqual([
      "Average speed",
      "Median event gap",
      "Confidence",
      "Input path",
    ]);
  });

  it("exports a CSV row for every recorded event", () => {
    const csv = scrollAttemptCsv(attempt());
    const rows = csv.trim().split("\n");
    expect(rows).toHaveLength(13);
    expect(rows[0]).toBe("event_number,time_ms,gap_ms,dx_px,dy_px,distance_px,input_source");
    expect(rows[1]).toBe("1,100,,0,120,120,wheel");
    expect(rows[2]).toBe("2,200,100,0,120,120,wheel");
  });

  it("exports a readable Markdown report and disclaimer", () => {
    const markdown = scrollAttemptMarkdown(attempt());
    expect(markdown).toContain("# Mouse Scroll Test report");
    expect(markdown).toContain("## Per-event evidence");
    expect(markdown).toContain("not certified hardware");
  });

  it("creates a useful pack README", () => {
    const readme = scrollPackReadme(attempt());
    expect(readme).toContain("scroll-session.json");
    expect(readme).toContain("scroll-events.csv");
  });

  it("creates a valid four-file production ZIP", async () => {
    const latest = attempt();
    const backup = createScrollBackup({ mode: 10 }, [latest]);
    const bytes = await createScrollProductionPack(backup, latest);
    const zip = await JSZip.loadAsync(bytes);
    expect(Object.keys(zip.files).sort()).toEqual([
      "README.md",
      "scroll-events.csv",
      "scroll-report.md",
      "scroll-session.json",
    ]);
    const json = JSON.parse(await zip.file("scroll-session.json")!.async("string"));
    expect(json.schema).toBe("darma.mouse-scroll-session");
  });
});
