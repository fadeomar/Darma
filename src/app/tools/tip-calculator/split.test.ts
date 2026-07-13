import { describe, expect, it } from "vitest";
import { DEFAULT_TIP_INPUT } from "./presets";
import {
  buildGuestCsv,
  buildJavaScriptSnippet,
  buildScenarioCsv,
  buildTipChecks,
  buildTipScenarios,
  buildTipSummaryMarkdown,
  computeSplit,
  getCurrencyMinorDigits,
  validateTipInput,
} from "./split";

describe("tip and bill split logic", () => {
  it("calculates tax, tip, and total using the selected basis", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 100, taxPercent: 10, servicePercent: 0, tipPercent: 20, people: 2 });
    expect(result?.taxAmount).toBe(10);
    expect(result?.tipBasisAmount).toBe(110);
    expect(result?.tipAmount).toBe(22);
    expect(result?.totalBeforeRounding).toBe(132);
    expect(result?.totalCollected).toBe(132);
  });

  it("supports subtotal-only tips", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 100, taxPercent: 10, tipPercent: 20, tipBasis: "subtotal" });
    expect(result?.tipAmount).toBe(20);
  });

  it("can include service charge in the tip basis", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 100, taxPercent: 10, servicePercent: 10, tipPercent: 20, tipBasis: "pretip-total" });
    expect(result?.tipBasisAmount).toBe(120);
    expect(result?.tipAmount).toBe(24);
  });

  it("distributes indivisible minor units without losing the bill total", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 10, taxPercent: 0, tipPercent: 0, people: 3, roundMode: "fair" });
    expect(result?.guestShares.map((share) => share.finalShare)).toEqual([3.34, 3.33, 3.33]);
    expect(result?.totalCollected).toBe(10);
  });

  it("supports weighted guest shares", () => {
    const result = computeSplit({
      ...DEFAULT_TIP_INPUT,
      subtotal: 90,
      taxPercent: 0,
      tipPercent: 0,
      splitMode: "weighted",
      guests: [
        { id: "a", name: "Adult", weight: 2 },
        { id: "b", name: "Child", weight: 1 },
      ],
    });
    expect(result?.guestShares.map((share) => share.finalShare)).toEqual([60, 30]);
    expect(result?.guestShares[0].sharePercent).toBeCloseTo(66.6667, 3);
  });

  it("rounds every share upward to whole currency units", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 10, taxPercent: 0, tipPercent: 0, people: 3, roundMode: "up-whole" });
    expect(result?.guestShares.map((share) => share.finalShare)).toEqual([4, 4, 4]);
    expect(result?.roundingDelta).toBe(2);
  });

  it("uses zero decimal places for JPY", () => {
    const result = computeSplit({ ...DEFAULT_TIP_INPUT, subtotal: 1001, taxPercent: 0, tipPercent: 0, people: 2, currency: "JPY" });
    expect(getCurrencyMinorDigits("JPY")).toBe(0);
    expect(result?.guestShares.map((share) => share.finalShare)).toEqual([501, 500]);
  });

  it("rejects invalid percentages and people", () => {
    expect(validateTipInput({ ...DEFAULT_TIP_INPUT, tipPercent: -1 })).toMatch(/between/);
    expect(validateTipInput({ ...DEFAULT_TIP_INPUT, people: 0 })).toMatch(/People/);
    expect(computeSplit({ ...DEFAULT_TIP_INPUT, servicePercent: 101 })).toBeNull();
  });

  it("rejects non-positive weighted guest weights", () => {
    const input = { ...DEFAULT_TIP_INPUT, splitMode: "weighted" as const, guests: [{ id: "a", name: "A", weight: 0 }] };
    expect(validateTipInput(input)).toMatch(/weight/);
  });

  it("builds practical tip scenarios", () => {
    const scenarios = buildTipScenarios({ ...DEFAULT_TIP_INPUT, subtotal: 100, taxPercent: 0, people: 2 });
    expect(scenarios).toHaveLength(6);
    expect(scenarios.find((scenario) => scenario.tipPercent === 20)?.total).toBe(120);
  });

  it("warns when service charge and tip are both present", () => {
    const input = { ...DEFAULT_TIP_INPUT, servicePercent: 15, tipPercent: 20 };
    const checks = buildTipChecks(input, computeSplit(input));
    expect(checks.some((check) => check.id === "double-gratuity" && check.level === "warning")).toBe(true);
  });

  it("reports round-up overcollection", () => {
    const input = { ...DEFAULT_TIP_INPUT, subtotal: 10, taxPercent: 0, tipPercent: 0, people: 3, roundMode: "up-whole" as const };
    const result = computeSplit(input);
    const checks = buildTipChecks(input, result);
    expect(checks.some((check) => check.id === "rounding")).toBe(true);
  });

  it("exports guest and scenario CSV files", () => {
    const result = computeSplit(DEFAULT_TIP_INPUT);
    expect(buildGuestCsv(result)).toContain("share_percent");
    expect(buildGuestCsv(result)).toContain("Guest 1");
    expect(buildScenarioCsv(buildTipScenarios(DEFAULT_TIP_INPUT))).toContain("tip_percent");
  });

  it("exports readable Markdown", () => {
    const result = computeSplit(DEFAULT_TIP_INPUT);
    const markdown = buildTipSummaryMarkdown(DEFAULT_TIP_INPUT, result, buildTipChecks(DEFAULT_TIP_INPUT, result));
    expect(markdown).toContain("# Tip and bill split");
    expect(markdown).toContain("## Guest shares");
  });

  it("exports a valid JavaScript starter", () => {
    const snippet = buildJavaScriptSnippet();
    expect(snippet).toContain("function splitBill");
    expect(() => new Function(`${snippet}; return splitBill;`)()).not.toThrow();
  });
});
