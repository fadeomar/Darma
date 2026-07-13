export type CurrencyCode = "USD" | "EUR" | "GBP" | "ILS";
export type LoanTab = "overview" | "monthly" | "annual" | "compare";
export type LoanCheckLevel = "success" | "info" | "warning" | "danger";

export type LoanScenarioInput = {
  amount: number;
  downPayment: number;
  financedFees: number;
  annualRate: number;
  termMonths: number;
  extraMonthlyPayment: number;
  oneTimeExtraPayment: number;
  oneTimeExtraMonth: number;
  startDate: string;
};

export type LoanOptions = {
  currency: CurrencyCode;
  precision: 0 | 2;
};

export type LoanMonthlyRow = {
  paymentNumber: number;
  date: string;
  openingBalance: number;
  scheduledPayment: number;
  extraPayment: number;
  totalPayment: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
  cumulativeInterest: number;
};

export type LoanAnnualRow = {
  year: number;
  calendarYear: number;
  payments: number;
  principalPaid: number;
  interestPaid: number;
  extraPaid: number;
  totalPaid: number;
  closingBalance: number;
};

export type LoanResult = {
  financedPrincipal: number;
  scheduledMonthlyPayment: number;
  payoffMonths: number;
  contractualTermMonths: number;
  totalPayment: number;
  totalInterest: number;
  totalExtraPayment: number;
  totalCashOutlay: number;
  interestSharePercent: number;
  monthlySchedule: LoanMonthlyRow[];
  annualSchedule: LoanAnnualRow[];
};

export type LoanComparison = {
  baseline: LoanResult;
  accelerated: LoanResult;
  interestSaved: number;
  monthsSaved: number;
  paymentIncrease: number;
};

export type LoanCheck = {
  id: string;
  level: LoanCheckLevel;
  title: string;
  message: string;
};

export type LoanPreset = {
  id: string;
  name: string;
  description: string;
  input: LoanScenarioInput;
  options?: Partial<LoanOptions>;
};

export type LoanReport = {
  generatedAt: string;
  input: LoanScenarioInput;
  options: LoanOptions;
  result: Omit<LoanResult, "monthlySchedule" | "annualSchedule">;
  comparison: {
    interestSaved: number;
    monthsSaved: number;
    paymentIncrease: number;
  };
  checks: LoanCheck[];
  monthlySchedule: LoanMonthlyRow[];
  annualSchedule: LoanAnnualRow[];
};
