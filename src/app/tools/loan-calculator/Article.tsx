export default function LoanCalculatorArticle() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Plan the full borrowing scenario</h2>
        <p>This studio estimates a fixed-rate loan from the amount, upfront payment, financed fees, nominal annual rate, term, and first-payment date. It produces payment-level and annual amortization schedules instead of showing only a headline monthly payment.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What the results include</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>The principal actually financed after the upfront payment and financed fees.</li>
          <li>The contractual scheduled payment and the estimated payoff date.</li>
          <li>Total interest, total loan payments, and total cash outlay.</li>
          <li>A monthly amortization table and a compact annual rollup.</li>
          <li>A baseline comparison that shows interest and time saved by extra payments.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How extra payments are modeled</h2>
        <p>Recurring and one-time extra payments are applied directly to principal after the scheduled payment. The comparison keeps the amount, fees, rate, and contractual term unchanged, then removes the extras to create a no-extra baseline. This makes the estimated interest and payoff savings easy to audit.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Start from the borrowing goal, not the numbers</h2>
        <p>
          The scenario picker is grouped by what the money is for: Home covers mortgages,
          first-home deposits, 15-year comparisons, accelerated payoff, refinancing, and
          renovation; Vehicle covers new, used, and small vehicle loans; Education covers
          undergraduate and long graduate terms; Personal and debt covers consolidation,
          card payoff, and lump-sum scenarios; Retail and business covers installment plans
          and equipment financing. Load the closest scenario, then replace the amount, rate,
          and term with the figures from your own offer.
        </p>
        <p>
          Several scenarios exist specifically to be compared against each other. The
          15-year mortgage and the accelerated mortgage both start from the same principal
          as the standard 30-year preset, so switching between them shows the real cost of
          the term and of extra payments without rebuilding the inputs each time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Important assumptions</h2>
        <p>The calculation assumes a fixed nominal rate, monthly compounding, monthly payments, and no prepayment penalty. It does not include taxes, insurance, variable-rate adjustments, late charges, escrow, or lender-specific rounding rules. A nominal interest rate is not necessarily the same as a disclosed APR, especially when fees are involved.</p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Use exports for review, not as a contract</h2>
        <p>The Markdown, CSV, JSON, and ZIP exports are useful for scenario review and record keeping. Confirm every important figure against the lender&apos;s official disclosure and repayment terms before making a financial decision.</p>
      </section>
    </div>
  );
}
