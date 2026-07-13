import { describe, expect, it } from "vitest";
import {
  addMonthsToIsoDate,
  buildAnnualScheduleCsv,
  buildLoanChecks,
  buildMonthlyScheduleCsv,
  calculateScheduledPayment,
  compareLoanScenarios,
  computeLoan,
  isValidIsoDate,
  validateLoanInput,
} from "./loan";
import type { LoanScenarioInput } from "./types";

const base: LoanScenarioInput = {
  amount: 20000,
  downPayment: 0,
  financedFees: 0,
  annualRate: 5,
  termMonths: 60,
  extraMonthlyPayment: 0,
  oneTimeExtraPayment: 0,
  oneTimeExtraMonth: 12,
  startDate: "2026-08-01",
};

describe("loan calculation", () => {
  it("calculates a standard amortized payment", () => {
    expect(calculateScheduledPayment(20000, 5, 60)).toBeCloseTo(377.4247, 3);
    const result = computeLoan(base);
    expect(result?.scheduledMonthlyPayment).toBe(377.42);
    expect(result?.payoffMonths).toBe(60);
    expect(result?.monthlySchedule).toHaveLength(60);
    expect(result?.monthlySchedule.at(-1)?.closingBalance).toBe(0);
    expect(result?.totalInterest).toBeCloseTo(2645.52, 1);
  });

  it("handles a zero-interest installment plan", () => {
    const result = computeLoan({ ...base, amount: 1200, annualRate: 0, termMonths: 12 });
    expect(result?.scheduledMonthlyPayment).toBe(100);
    expect(result?.totalInterest).toBe(0);
    expect(result?.totalPayment).toBe(1200);
  });

  it("includes down payment and financed fees in the financed principal", () => {
    const result = computeLoan({ ...base, amount: 30000, downPayment: 5000, financedFees: 700 });
    expect(result?.financedPrincipal).toBe(25700);
    expect(result?.totalCashOutlay).toBeCloseTo((result?.totalPayment ?? 0) + 5000, 2);
  });

  it("applies recurring extra payments and saves time and interest", () => {
    const comparison = compareLoanScenarios({ ...base, extraMonthlyPayment: 100 });
    expect(comparison).not.toBeNull();
    expect(comparison!.accelerated.payoffMonths).toBeLessThan(comparison!.baseline.payoffMonths);
    expect(comparison!.interestSaved).toBeGreaterThan(0);
    expect(comparison!.monthsSaved).toBeGreaterThan(0);
  });

  it("applies a one-time extra payment in the selected month", () => {
    const result = computeLoan({ ...base, oneTimeExtraPayment: 1000, oneTimeExtraMonth: 6 });
    expect(result?.monthlySchedule[5]?.extraPayment).toBe(1000);
    expect(result?.monthlySchedule[4]?.extraPayment).toBe(0);
  });

  it("caps the final payment instead of overpaying", () => {
    const result = computeLoan({ ...base, amount: 1000, termMonths: 12, extraMonthlyPayment: 5000 });
    expect(result?.payoffMonths).toBe(1);
    expect(result?.monthlySchedule[0]!.closingBalance).toBe(0);
    expect(result?.monthlySchedule[0]!.totalPayment).toBeLessThan(5100);
  });

  it("creates monthly and annual schedules that reconcile", () => {
    const result = computeLoan(base)!;
    const annualPrincipal = result.annualSchedule.reduce((sum, row) => sum + row.principalPaid, 0);
    const annualInterest = result.annualSchedule.reduce((sum, row) => sum + row.interestPaid, 0);
    expect(annualPrincipal).toBeCloseTo(result.financedPrincipal, 1);
    expect(annualInterest).toBeCloseTo(result.totalInterest, 1);
    expect(result.annualSchedule).toHaveLength(5);
  });

  it("keeps end-of-month dates valid when adding months", () => {
    expect(addMonthsToIsoDate("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToIsoDate("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsToIsoDate("2026-12-31", 1)).toBe("2027-01-31");
  });

  it("validates ISO dates and invalid financial inputs", () => {
    expect(isValidIsoDate("2026-02-28")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(validateLoanInput({ ...base, downPayment: 20000 })).toMatch(/upfront payment/i);
    expect(validateLoanInput({ ...base, annualRate: -1 })).toMatch(/interest rate/i);
    expect(computeLoan({ ...base, termMonths: 0 })).toBeNull();
  });

  it("warns when a one-time payment falls outside the term", () => {
    const input = { ...base, oneTimeExtraPayment: 500, oneTimeExtraMonth: 80 };
    const checks = buildLoanChecks(input, compareLoanScenarios(input));
    expect(checks.some((check) => check.id === "extra-month" && check.level === "warning")).toBe(true);
  });

  it("exports monthly and annual schedules as CSV", () => {
    const result = computeLoan({ ...base, termMonths: 12 })!;
    const monthly = buildMonthlyScheduleCsv(result);
    const annual = buildAnnualScheduleCsv(result);
    expect(monthly).toContain("payment_number,date,opening_balance");
    expect(monthly).toContain("2026-08-01");
    expect(annual).toContain("loan_year,calendar_year,payments");
    expect(annual.split("\n")).toHaveLength(3);
  });
});
