export type LoanInput = { principal: number; annualRate: number; termMonths: number };
export type AmortizationYear = { year: number; principalPaid: number; interestPaid: number; remainingBalance: number };
export type LoanResult = { monthlyPayment: number; totalPayment: number; totalInterest: number; termMonths: number; schedule: AmortizationYear[] };

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeLoan(input: LoanInput): LoanResult | null {
  const { principal, annualRate, termMonths } = input;
  if (![principal, annualRate, termMonths].every(Number.isFinite) || principal <= 0 || annualRate < 0 || termMonths < 1) return null;

  const months = Math.floor(termMonths);
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = monthlyRate === 0
    ? principal / months
    : principal * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  if (!Number.isFinite(monthlyPayment)) return null;

  const schedule: AmortizationYear[] = [];
  let balance = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= months; month += 1) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    const principalPayment = month === months ? balance : Math.min(balance, monthlyPayment - interest);
    balance = Math.max(0, balance - principalPayment);
    yearPrincipal += principalPayment;
    yearInterest += interest;

    if (month % 12 === 0 || month === months) {
      schedule.push({
        year: Math.ceil(month / 12),
        principalPaid: round2(yearPrincipal),
        interestPaid: round2(yearInterest),
        remainingBalance: round2(balance),
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  const totalPayment = monthlyPayment * months;
  return {
    monthlyPayment: round2(monthlyPayment),
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalPayment - principal),
    termMonths: months,
    schedule,
  };
}
