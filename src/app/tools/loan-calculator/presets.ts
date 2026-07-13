import type { LoanOptions, LoanPreset, LoanScenarioInput } from "./types";

export const DEFAULT_LOAN_INPUT: LoanScenarioInput = {
  amount: 30000,
  downPayment: 5000,
  financedFees: 700,
  annualRate: 6.25,
  termMonths: 60,
  extraMonthlyPayment: 0,
  oneTimeExtraPayment: 0,
  oneTimeExtraMonth: 12,
  startDate: "2026-08-01",
};

export const DEFAULT_LOAN_OPTIONS: LoanOptions = {
  currency: "USD",
  precision: 2,
};

export const LOAN_PRESETS: LoanPreset[] = [
  {
    id: "car-loan",
    name: "Car loan",
    description: "Five-year vehicle financing with a down payment and financed fees.",
    input: { ...DEFAULT_LOAN_INPUT },
  },
  {
    id: "mortgage",
    name: "Home mortgage",
    description: "Thirty-year mortgage with a 20% down payment.",
    input: {
      amount: 320000,
      downPayment: 64000,
      financedFees: 4500,
      annualRate: 5.75,
      termMonths: 360,
      extraMonthlyPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 12,
      startDate: "2026-08-01",
    },
  },
  {
    id: "accelerated-mortgage",
    name: "Accelerated mortgage",
    description: "Compare a recurring extra payment against a standard mortgage.",
    input: {
      amount: 320000,
      downPayment: 64000,
      financedFees: 4500,
      annualRate: 5.75,
      termMonths: 360,
      extraMonthlyPayment: 250,
      oneTimeExtraPayment: 2500,
      oneTimeExtraMonth: 12,
      startDate: "2026-08-01",
    },
  },
  {
    id: "student-loan",
    name: "Student loan",
    description: "Ten-year education loan without a down payment.",
    input: {
      amount: 45000,
      downPayment: 0,
      financedFees: 0,
      annualRate: 4.8,
      termMonths: 120,
      extraMonthlyPayment: 75,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 12,
      startDate: "2026-08-01",
    },
  },
  {
    id: "personal-loan",
    name: "Personal loan",
    description: "Three-year unsecured loan with a higher fixed rate.",
    input: {
      amount: 12000,
      downPayment: 0,
      financedFees: 300,
      annualRate: 11.9,
      termMonths: 36,
      extraMonthlyPayment: 50,
      oneTimeExtraPayment: 500,
      oneTimeExtraMonth: 6,
      startDate: "2026-08-01",
    },
  },
  {
    id: "zero-interest",
    name: "Zero-interest plan",
    description: "A simple installment plan with no interest.",
    input: {
      amount: 2400,
      downPayment: 400,
      financedFees: 0,
      annualRate: 0,
      termMonths: 12,
      extraMonthlyPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 6,
      startDate: "2026-08-01",
    },
  },
];
