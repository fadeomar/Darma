import type {
  LoanAnnualRow,
  LoanCheck,
  LoanComparison,
  LoanMonthlyRow,
  LoanOptions,
  LoanReport,
  LoanResult,
  LoanScenarioInput,
} from "./types";

export const MAX_LOAN_MONTHS = 600;
export const MAX_LOAN_AMOUNT = 1_000_000_000;

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addMonthsToIsoDate(value: string, monthOffset: number) {
  const safe = isValidIsoDate(value) ? value : "1970-01-01";
  const [year, month, day] = safe.split("-").map(Number) as [number, number, number];
  const target = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function calculateScheduledPayment(principal: number, annualRate: number, termMonths: number) {
  if (![principal, annualRate, termMonths].every(Number.isFinite) || principal <= 0 || annualRate < 0 || termMonths < 1) return Number.NaN;
  const months = Math.floor(termMonths);
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  const factor = (1 + monthlyRate) ** months;
  const payment = principal * monthlyRate * factor / (factor - 1);
  return Number.isFinite(payment) ? payment : Number.NaN;
}

function normalizeInput(input: LoanScenarioInput): LoanScenarioInput {
  return {
    ...input,
    termMonths: Math.floor(input.termMonths),
    oneTimeExtraMonth: Math.floor(input.oneTimeExtraMonth),
  };
}

export function validateLoanInput(rawInput: LoanScenarioInput) {
  const input = normalizeInput(rawInput);
  const numericValues = [
    input.amount,
    input.downPayment,
    input.financedFees,
    input.annualRate,
    input.termMonths,
    input.extraMonthlyPayment,
    input.oneTimeExtraPayment,
    input.oneTimeExtraMonth,
  ];
  if (!numericValues.every(Number.isFinite)) return "All loan values must be finite numbers.";
  if (input.amount <= 0) return "Amount must be greater than zero.";
  if (input.amount > MAX_LOAN_AMOUNT) return `Amount must not exceed ${MAX_LOAN_AMOUNT.toLocaleString()}.`;
  if (input.downPayment < 0 || input.downPayment >= input.amount) return "Upfront payment must be at least zero and lower than the amount.";
  if (input.financedFees < 0) return "Financed fees cannot be negative.";
  if (input.annualRate < 0 || input.annualRate > 100) return "Annual interest rate must be between 0% and 100%.";
  if (input.termMonths < 1 || input.termMonths > MAX_LOAN_MONTHS) return `Term must be between 1 and ${MAX_LOAN_MONTHS} months.`;
  if (input.extraMonthlyPayment < 0 || input.oneTimeExtraPayment < 0) return "Extra payments cannot be negative.";
  if (input.oneTimeExtraMonth < 1) return "One-time extra payment month must be at least 1.";
  if (!isValidIsoDate(input.startDate)) return "First payment date must be a valid ISO date.";
  const financedPrincipal = input.amount - input.downPayment + input.financedFees;
  if (!Number.isFinite(financedPrincipal) || financedPrincipal <= 0) return "Financed principal must be greater than zero.";
  return null;
}

export function computeLoan(rawInput: LoanScenarioInput): LoanResult | null {
  const validationError = validateLoanInput(rawInput);
  if (validationError) return null;
  const input = normalizeInput(rawInput);
  const financedPrincipal = input.amount - input.downPayment + input.financedFees;
  const scheduledMonthlyPayment = calculateScheduledPayment(financedPrincipal, input.annualRate, input.termMonths);
  if (!Number.isFinite(scheduledMonthlyPayment) || scheduledMonthlyPayment <= 0) return null;

  const roundedScheduledPayment = roundMoney(scheduledMonthlyPayment);
  const monthlyRate = input.annualRate / 100 / 12;
  const monthlySchedule: LoanMonthlyRow[] = [];
  let balance = roundMoney(financedPrincipal);
  let cumulativeInterest = 0;
  let totalPayment = 0;
  let totalExtraPayment = 0;

  for (let paymentNumber = 1; paymentNumber <= input.termMonths && balance > 0; paymentNumber += 1) {
    const openingBalance = roundMoney(balance);
    const interestPaid = monthlyRate === 0 ? 0 : roundMoney(openingBalance * monthlyRate);
    const amountDue = roundMoney(openingBalance + interestPaid);
    const requestedExtra = roundMoney(input.extraMonthlyPayment + (paymentNumber === input.oneTimeExtraMonth ? input.oneTimeExtraPayment : 0));
    const scheduledApplied = paymentNumber === input.termMonths ? amountDue : Math.min(roundedScheduledPayment, amountDue);
    const extraApplied = roundMoney(Math.min(requestedExtra, Math.max(0, amountDue - scheduledApplied)));
    const payment = roundMoney(scheduledApplied + extraApplied);
    const principalPaid = roundMoney(Math.max(0, payment - interestPaid));
    balance = roundMoney(Math.max(0, openingBalance - principalPaid));
    cumulativeInterest = roundMoney(cumulativeInterest + interestPaid);
    totalPayment = roundMoney(totalPayment + payment);
    totalExtraPayment = roundMoney(totalExtraPayment + extraApplied);

    monthlySchedule.push({
      paymentNumber,
      date: addMonthsToIsoDate(input.startDate, paymentNumber - 1),
      openingBalance,
      scheduledPayment: roundMoney(scheduledApplied),
      extraPayment: extraApplied,
      totalPayment: payment,
      principalPaid,
      interestPaid,
      closingBalance: balance,
      cumulativeInterest,
    });
  }

  const annualMap = new Map<number, LoanAnnualRow>();
  for (const row of monthlySchedule) {
    const year = Math.ceil(row.paymentNumber / 12);
    const calendarYear = Number(row.date.slice(0, 4));
    const existing = annualMap.get(year) ?? {
      year,
      calendarYear,
      payments: 0,
      principalPaid: 0,
      interestPaid: 0,
      extraPaid: 0,
      totalPaid: 0,
      closingBalance: row.closingBalance,
    };
    existing.payments += 1;
    existing.principalPaid += row.principalPaid;
    existing.interestPaid += row.interestPaid;
    existing.extraPaid += row.extraPayment;
    existing.totalPaid += row.totalPayment;
    existing.closingBalance = row.closingBalance;
    annualMap.set(year, existing);
  }

  const annualSchedule = [...annualMap.values()].map((row) => ({
    ...row,
    principalPaid: roundMoney(row.principalPaid),
    interestPaid: roundMoney(row.interestPaid),
    extraPaid: roundMoney(row.extraPaid),
    totalPaid: roundMoney(row.totalPaid),
    closingBalance: roundMoney(row.closingBalance),
  }));
  const roundedTotalPayment = roundMoney(totalPayment);
  const totalInterest = roundMoney(cumulativeInterest);

  return {
    financedPrincipal: roundMoney(financedPrincipal),
    scheduledMonthlyPayment: roundedScheduledPayment,
    payoffMonths: monthlySchedule.length,
    contractualTermMonths: input.termMonths,
    totalPayment: roundedTotalPayment,
    totalInterest,
    totalExtraPayment: roundMoney(totalExtraPayment),
    totalCashOutlay: roundMoney(input.downPayment + roundedTotalPayment),
    interestSharePercent: roundedTotalPayment > 0 ? roundMoney((totalInterest / roundedTotalPayment) * 100) : 0,
    monthlySchedule,
    annualSchedule,
  };
}

export function compareLoanScenarios(input: LoanScenarioInput): LoanComparison | null {
  const accelerated = computeLoan(input);
  const baseline = computeLoan({
    ...input,
    extraMonthlyPayment: 0,
    oneTimeExtraPayment: 0,
  });
  if (!baseline || !accelerated) return null;
  return {
    baseline,
    accelerated,
    interestSaved: roundMoney(Math.max(0, baseline.totalInterest - accelerated.totalInterest)),
    monthsSaved: Math.max(0, baseline.payoffMonths - accelerated.payoffMonths),
    paymentIncrease: roundMoney(input.extraMonthlyPayment),
  };
}

export function buildLoanChecks(input: LoanScenarioInput, comparison: LoanComparison | null): LoanCheck[] {
  const checks: LoanCheck[] = [];
  const error = validateLoanInput(input);
  if (error) {
    checks.push({ id: "input", level: "danger", title: "Invalid loan input", message: error });
    return checks;
  }
  const result = comparison?.accelerated;
  const feeRatio = input.financedFees / Math.max(1, input.amount - input.downPayment);
  const downPaymentRatio = input.downPayment / input.amount;

  checks.push({ id: "fixed", level: "info", title: "Fixed-rate model", message: "The estimate assumes a fixed nominal rate and monthly payments. Taxes, insurance, penalties, and variable-rate changes are not included." });
  if (input.annualRate === 0) checks.push({ id: "zero-rate", level: "success", title: "Zero-interest plan", message: "Payments are divided evenly because the entered annual rate is 0%." });
  if (input.annualRate >= 20) checks.push({ id: "high-rate", level: input.annualRate >= 40 ? "danger" : "warning", title: "High borrowing rate", message: `${input.annualRate}% is a high nominal annual rate. Confirm the lender disclosure and total cost before relying on this estimate.` });
  if (feeRatio >= 0.1) checks.push({ id: "fees", level: "danger", title: "Large financed fees", message: `Financed fees equal ${roundMoney(feeRatio * 100)}% of the amount financed before fees.` });
  else if (feeRatio >= 0.03) checks.push({ id: "fees", level: "warning", title: "Review financed fees", message: `Financed fees add ${roundMoney(feeRatio * 100)}% to the pre-fee financed amount and accrue interest.` });
  if (input.downPayment > 0 && downPaymentRatio < 0.1) checks.push({ id: "down-payment", level: "info", title: "Small upfront payment", message: `The upfront payment is ${roundMoney(downPaymentRatio * 100)}% of the entered amount.` });
  if (input.oneTimeExtraPayment > 0 && input.oneTimeExtraMonth > input.termMonths) checks.push({ id: "extra-month", level: "warning", title: "One-time extra falls outside the term", message: `Month ${input.oneTimeExtraMonth} is later than the ${input.termMonths}-month contractual term, so the extra payment will not be applied.` });
  if (comparison && comparison.monthsSaved > 0) checks.push({ id: "acceleration", level: "success", title: "Earlier payoff", message: `The entered extra payments shorten payoff by ${comparison.monthsSaved} month${comparison.monthsSaved === 1 ? "" : "s"} and save an estimated ${comparison.interestSaved.toFixed(2)} in interest.` });
  if (result && result.interestSharePercent >= 40) checks.push({ id: "interest-share", level: "warning", title: "Interest is a large share of payments", message: `${result.interestSharePercent}% of estimated loan payments go to interest.` });
  if (input.termMonths > 360) checks.push({ id: "long-term", level: "warning", title: "Very long repayment term", message: `${input.termMonths} months can reduce the scheduled payment while materially increasing lifetime interest.` });
  if (checks.every((check) => check.level !== "warning" && check.level !== "danger")) checks.push({ id: "ready", level: "success", title: "Inputs are internally consistent", message: "No structural issue was found in the entered fixed-rate scenario." });
  return checks;
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildMonthlyScheduleCsv(result: LoanResult | null) {
  const rows: Array<Array<string | number>> = [["payment_number", "date", "opening_balance", "scheduled_payment", "extra_payment", "total_payment", "principal_paid", "interest_paid", "closing_balance", "cumulative_interest"]];
  if (result) for (const row of result.monthlySchedule) rows.push([row.paymentNumber, row.date, row.openingBalance, row.scheduledPayment, row.extraPayment, row.totalPayment, row.principalPaid, row.interestPaid, row.closingBalance, row.cumulativeInterest]);
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function buildAnnualScheduleCsv(result: LoanResult | null) {
  const rows: Array<Array<string | number>> = [["loan_year", "calendar_year", "payments", "principal_paid", "interest_paid", "extra_paid", "total_paid", "closing_balance"]];
  if (result) for (const row of result.annualSchedule) rows.push([row.year, row.calendarYear, row.payments, row.principalPaid, row.interestPaid, row.extraPaid, row.totalPaid, row.closingBalance]);
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function buildLoanSummaryMarkdown(input: LoanScenarioInput, comparison: LoanComparison | null, checks: LoanCheck[], formatMoney: (value: number) => string) {
  if (!comparison) return "# Loan analysis\n\nEnter valid values to generate an analysis.\n";
  const { accelerated, baseline } = comparison;
  const lines = [
    "# Loan analysis",
    "",
    `- Amount / price: ${formatMoney(input.amount)}`,
    `- Upfront payment: ${formatMoney(input.downPayment)}`,
    `- Financed fees: ${formatMoney(input.financedFees)}`,
    `- Financed principal: ${formatMoney(accelerated.financedPrincipal)}`,
    `- Nominal annual rate: ${input.annualRate}%`,
    `- Contractual term: ${input.termMonths} months`,
    `- Scheduled monthly payment: ${formatMoney(accelerated.scheduledMonthlyPayment)}`,
    `- Estimated payoff: ${accelerated.payoffMonths} months`,
    `- Total interest: ${formatMoney(accelerated.totalInterest)}`,
    `- Total loan payments: ${formatMoney(accelerated.totalPayment)}`,
    `- Total cash outlay including upfront payment: ${formatMoney(accelerated.totalCashOutlay)}`,
    "",
    "## Extra-payment comparison",
    "",
    `- Baseline interest: ${formatMoney(baseline.totalInterest)}`,
    `- Interest saved: ${formatMoney(comparison.interestSaved)}`,
    `- Months saved: ${comparison.monthsSaved}`,
    "",
    "## Production review",
    "",
    ...checks.map((check) => `- **${check.level.toUpperCase()} — ${check.title}:** ${check.message}`),
    "",
    "> Estimate only. Confirm lender disclosures, APR, fees, payment timing, and prepayment rules before making a financial decision.",
    "",
  ];
  return lines.join("\n");
}

export function buildLoanReport(input: LoanScenarioInput, options: LoanOptions, comparison: LoanComparison, checks: LoanCheck[]): LoanReport {
  const { monthlySchedule, annualSchedule, ...result } = comparison.accelerated;
  return {
    generatedAt: new Date().toISOString(),
    input,
    options,
    result,
    comparison: {
      interestSaved: comparison.interestSaved,
      monthsSaved: comparison.monthsSaved,
      paymentIncrease: comparison.paymentIncrease,
    },
    checks,
    monthlySchedule,
    annualSchedule,
  };
}
