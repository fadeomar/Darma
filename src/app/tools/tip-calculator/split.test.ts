import { describe, expect, it } from "vitest";
import { computeSplit, formatMoney } from "./split";

describe("computeSplit", () => {
  it("computes tip, total, and per-person share", () => {
    const result = computeSplit({ bill: 100, tipPercent: 20, people: 4, roundUp: false });
    expect(result).not.toBeNull();
    expect(result!.tipAmount).toBe(20);
    expect(result!.total).toBe(120);
    expect(result!.perPerson).toBe(30);
    expect(result!.perPersonBill).toBe(25);
    expect(result!.perPersonTip).toBe(5);
  });

  it("rounds each share up to the next whole unit when asked", () => {
    // 100 + 15% = 115, /3 = 38.333... -> rounded up to 39
    const result = computeSplit({ bill: 100, tipPercent: 15, people: 3, roundUp: true });
    expect(result!.perPerson).toBe(39);
    expect(result!.rounded).toBe(true);
    expect(result!.totalCollected).toBe(117);
  });

  it("does not flag rounding when the share is already whole", () => {
    const result = computeSplit({ bill: 100, tipPercent: 20, people: 4, roundUp: true });
    expect(result!.perPerson).toBe(30);
    expect(result!.rounded).toBe(false);
  });

  it("handles a zero tip", () => {
    const result = computeSplit({ bill: 50, tipPercent: 0, people: 2, roundUp: false });
    expect(result!.tipAmount).toBe(0);
    expect(result!.perPerson).toBe(25);
  });

  it("rounds cents correctly", () => {
    const result = computeSplit({ bill: 53.45, tipPercent: 18, people: 2, roundUp: false });
    // tip = 9.621 -> 9.62, total = 63.07, /2 = 31.535 -> 31.54
    expect(result!.tipAmount).toBe(9.62);
    expect(result!.total).toBe(63.07);
    expect(result!.perPerson).toBe(31.54);
  });

  it("rejects invalid input", () => {
    expect(computeSplit({ bill: -1, tipPercent: 10, people: 2, roundUp: false })).toBeNull();
    expect(computeSplit({ bill: 10, tipPercent: 10, people: 0, roundUp: false })).toBeNull();
    expect(computeSplit({ bill: 10, tipPercent: Number.NaN, people: 2, roundUp: false })).toBeNull();
  });
});

describe("formatMoney", () => {
  it("always shows two decimals", () => {
    expect(formatMoney(30)).toBe("30.00");
    expect(formatMoney(31.5)).toBe("31.50");
    expect(formatMoney(1234.5)).toBe("1,234.50");
  });
  it("renders a dash for non-finite values", () => {
    expect(formatMoney(Number.NaN)).toBe("—");
  });
});
