import { describe, expect, it } from "vitest";
import { DEFAULT_FAKE_SCREEN_STATE } from "../presets";
import {
  buildFakeScreenAudit,
  buildFakeScreenMarkdown,
  buildFakeScreenQuery,
  buildFakeScreenSummary,
  buildStandaloneHtml,
  calculateFakeScreenProgress,
  getContrastRatio,
  normalizeFakeScreenState,
  parseFakeScreenConfig,
  readFakeScreenQuery,
  serializeFakeScreenConfig,
} from "./studio";

describe("normalizeFakeScreenState", () => {
  it("clamps numbers, sanitizes colors, and preserves valid values", () => {
    const state = normalizeFakeScreenState({
      mode: "canvas",
      canvasTemplate: "snow",
      canvasDensity: 9999,
      canvasPrimaryColor: "#ABC",
      canvasBackground: "not-a-color",
      screensaverSize: 2,
      errorStopCode: "bad code!?",
    });

    expect(state.mode).toBe("canvas");
    expect(state.canvasTemplate).toBe("snow");
    expect(state.canvasDensity).toBe(1300);
    expect(state.canvasPrimaryColor).toBe("#aabbcc");
    expect(state.canvasBackground).toBe(DEFAULT_FAKE_SCREEN_STATE.canvasBackground);
    expect(state.screensaverSize).toBe(24);
    expect(state.errorStopCode).toBe("BADCODE");
  });

  it("falls back when enum values are unknown", () => {
    const state = normalizeFakeScreenState({ mode: "video", updateTemplate: "future-os" });
    expect(state.mode).toBe(DEFAULT_FAKE_SCREEN_STATE.mode);
    expect(state.updateTemplate).toBe(DEFAULT_FAKE_SCREEN_STATE.updateTemplate);
  });
});

describe("progress calculation", () => {
  it("uses the manual progress exactly", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, updateProgressMode: "manual" as const, manualProgress: 73 };
    expect(calculateFakeScreenProgress(state, 0, 999_999)).toBe(73);
  });

  it("completes a linear timeline at 100 percent", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, updateProgressMode: "linear" as const, updateDurationMinutes: 10, updateStartPercent: 10 };
    expect(calculateFakeScreenProgress(state, 0, 10 * 60 * 1000)).toBe(100);
  });

  it("never lets stuck mode reach 100 percent", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, updateProgressMode: "stuck-99" as const, updateDurationMinutes: 1 };
    expect(calculateFakeScreenProgress(state, 0, 20 * 60 * 1000)).toBe(99);
  });

  it("lets realistic progress finish at the configured duration", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, updateProgressMode: "realistic" as const, updateDurationMinutes: 2 };
    expect(calculateFakeScreenProgress(state, 0, 2 * 60 * 1000)).toBe(100);
    expect(calculateFakeScreenProgress(state, 0, 90 * 1000)).toBeLessThan(100);
  });
});

describe("share query codec", () => {
  it("round-trips the complete editable state", () => {
    const state = normalizeFakeScreenState({
      ...DEFAULT_FAKE_SCREEN_STATE,
      mode: "screensaver",
      screensaverTemplate: "floating-text",
      screensaverText: "Phase 27",
      screensaverSpeed: "fast",
      screensaverSize: 92,
      screensaverBackground: "#123456",
      screensaverColor: "#fedcba",
      showCornerCounter: false,
      updateTitle: "A custom update title",
      errorMessage: "A custom error message",
      canvasDensity: 777,
      canvasSpeed: "slow",
    });
    const params = new URLSearchParams();
    Object.entries(buildFakeScreenQuery(state)).forEach(([key, value]) => params.set(key, String(value)));

    expect(readFakeScreenQuery(params)).toEqual(state);
  });

  it("continues to read the original short query fields", () => {
    const params = new URLSearchParams("mode=update&update=terminal&duration=15&start=44&progress=loop");
    const state = readFakeScreenQuery(params);
    expect(state.mode).toBe("update");
    expect(state.updateTemplate).toBe("terminal");
    expect(state.updateDurationMinutes).toBe(15);
    expect(state.updateStartPercent).toBe(44);
    expect(state.updateProgressMode).toBe("loop");
  });

  it("preserves intentionally empty editable text fields", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, updateTitle: "", updateSubtitle: "", screensaverText: "" };
    const params = new URLSearchParams();
    Object.entries(buildFakeScreenQuery(state)).forEach(([key, value]) => params.set(key, String(value)));
    const restored = readFakeScreenQuery(params);
    expect(restored.updateTitle).toBe("");
    expect(restored.updateSubtitle).toBe("");
    expect(restored.screensaverText).toBe("");
  });
});

describe("configuration import and export", () => {
  it("parses an exported configuration envelope", () => {
    const exported = serializeFakeScreenConfig(
      { ...DEFAULT_FAKE_SCREEN_STATE, mode: "color", color: "#112233" },
      "2026-07-14T00:00:00.000Z",
    );
    const parsed = parseFakeScreenConfig(exported);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.state.mode).toBe("color");
      expect(parsed.state.color).toBe("#112233");
    }
  });

  it("accepts a raw state object and rejects unrelated JSON", () => {
    const raw = parseFakeScreenConfig(JSON.stringify({ mode: "error", errorTemplate: "radar" }));
    expect(raw.ok).toBe(true);
    expect(parseFakeScreenConfig("{broken").ok).toBe(false);
    expect(parseFakeScreenConfig(JSON.stringify({ hello: "world" })).ok).toBe(false);
  });

  it("rejects foreign schemas and unsupported future versions", () => {
    expect(parseFakeScreenConfig(JSON.stringify({ schema: "darma.other", version: 1, state: { mode: "color" } })).ok).toBe(false);
    expect(parseFakeScreenConfig(JSON.stringify({ schema: "darma.fake-screen", version: 2, state: { mode: "color" } })).ok).toBe(false);
  });
});

describe("production audit", () => {
  it("blocks an empty update title and warns when disclosure is missing", () => {
    const checks = buildFakeScreenAudit({
      ...DEFAULT_FAKE_SCREEN_STATE,
      mode: "update",
      updateTitle: "",
      updateSubtitle: "Installing files now",
    });
    expect(checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "update-title", severity: "error" }),
      expect.objectContaining({ id: "update-disclosure", severity: "warning" }),
    ]));
  });

  it("warns when a finishable update has no completion message", () => {
    const checks = buildFakeScreenAudit({
      ...DEFAULT_FAKE_SCREEN_STATE,
      mode: "update",
      updateProgressMode: "linear",
      updateCompletionText: "",
    });
    expect(checks).toContainEqual(expect.objectContaining({ id: "update-completion", severity: "warning" }));
  });

  it("warns about low contrast and high canvas density", () => {
    const screensaverChecks = buildFakeScreenAudit({
      ...DEFAULT_FAKE_SCREEN_STATE,
      mode: "screensaver",
      screensaverColor: "#777777",
      screensaverBackground: "#777777",
    });
    expect(screensaverChecks).toContainEqual(expect.objectContaining({ id: "screensaver-contrast", severity: "warning" }));

    const canvasChecks = buildFakeScreenAudit({
      ...DEFAULT_FAKE_SCREEN_STATE,
      mode: "canvas",
      canvasDensity: 1200,
    });
    expect(canvasChecks).toContainEqual(expect.objectContaining({ id: "canvas-density", severity: "warning" }));
  });

  it("calculates familiar contrast ratios", () => {
    expect(getContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
    expect(getContrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });
});

describe("summaries and portable exports", () => {
  it("creates four compact summary cards", () => {
    const state = { ...DEFAULT_FAKE_SCREEN_STATE, mode: "update" as const };
    const checks = buildFakeScreenAudit(state);
    const cards = buildFakeScreenSummary(state, 52, checks);
    expect(cards).toHaveLength(4);
    expect(cards[1]).toMatchObject({ label: "Live state", value: "52%" });
  });

  it("generates standalone HTML with a safety notice and embedded config", () => {
    const html = buildStandaloneHtml({ ...DEFAULT_FAKE_SCREEN_STATE, mode: "error" });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Safe Darma visual demo");
    expect(html).toContain('id="darma-config"');
    expect(html).toContain("requestFullscreen");
  });

  it("generates a readable Markdown audit report", () => {
    const report = buildFakeScreenMarkdown(DEFAULT_FAKE_SCREEN_STATE);
    expect(report).toContain("# Darma Fake Screen production report");
    expect(report).toContain("## Production checks");
    expect(report).toContain("Responsible-use note");
  });
});
