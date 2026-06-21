import { describe, expect, it } from "vitest";
import { computeLoan } from "./loan";

describe("computeLoan", () => {
  it("returns null for invalid input", () => {
    expect(computeLoan({ principal: NaN, annualRate: 5, termMonths: 60 })).toBeNull();
    expect(computeLoan({ principal: 1000, annualRate: -1, termMonths: 12 })).toBeNull();
  });

  it("calculates a known fixed-rate loan", () => {
    const result = computeLoan({ principal: 20000, annualRate: 5, termMonths: 60 });
    expect(result).not.toBeNull();
    expect(result!.monthlyPayment).toBeCloseTo(377.42, 2);
    expect(result!.totalInterest).toBeCloseTo(2645.48, 2);
    expect(result!.schedule).toHaveLength(5);
  });

  it("handles a zero-interest loan", () => {
    const result = computeLoan({ principal: 1200, annualRate: 0, termMonths: 12 });
    expect(result!.monthlyPayment).toBe(100);
    expect(result!.totalInterest).toBe(0);
    expect(result!.schedule[0].remainingBalance).toBe(0);
  });

  it("aggregates partial years", () => {
    const result = computeLoan({ principal: 1800, annualRate: 0, termMonths: 18 });
    expect(result!.schedule).toHaveLength(2);
    expect(result!.schedule[1].principalPaid).toBe(600);
  });
});
