export default function LoanCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What does this calculator do?</h2><p>It estimates the monthly payment, total repayment, and total interest for a fixed-rate loan. The annual schedule shows how each year's payments are divided between principal and interest.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How it works</h2><p>The standard amortization formula converts the annual percentage rate to a monthly rate and spreads repayment over the selected number of months. Early payments generally contain more interest; later payments apply more toward principal.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Common uses</h2><ul className="list-inside list-disc space-y-2"><li>Estimate student or car loan repayments.</li><li>Compare mortgage terms and interest rates.</li><li>See the lifetime cost of borrowing.</li><li>Review an annual amortization summary.</li></ul></section>
    </div>
  );
}
