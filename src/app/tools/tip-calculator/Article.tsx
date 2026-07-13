export default function TipCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Build the split from the actual receipt
        </h2>
        <p>
          Start with the subtotal, then enter tax, an automatic service charge, and any additional
          tip. You can choose whether the tip applies to the subtotal only, subtotal plus tax, or the
          complete pre-tip amount. This matters when a receipt already contains gratuity or service.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Equal and weighted guest shares
        </h2>
        <p>
          Equal mode divides the final total across the selected headcount. Weighted mode assigns a
          relative weight to each guest, which is useful when children, shared dishes, or different
          consumption levels make an even split inappropriate. The calculator distributes minor-unit
          remainders deterministically so the guest rows add back to the calculated total.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Rounding without hiding the difference
        </h2>
        <p>
          Fair allocation preserves the exact bill total to the currency&apos;s smallest unit. Optional
          round-up modes make cash collection easier by rounding every guest to 0.05, 0.50, or a
          whole currency unit. Any extra amount collected is shown separately instead of being hidden
          inside the per-person result.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Review before paying
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Check whether an automatic service charge is already gratuity.</li>
          <li>Confirm whether the displayed receipt total already includes tax.</li>
          <li>Review the selected tip basis before applying a percentage.</li>
          <li>Compare common tip scenarios and inspect the round-up delta.</li>
          <li>Export guest shares, scenarios, and a structured audit locally.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy and limitations
        </h2>
        <p>
          All calculations and exports run in your browser. The result is an estimate and does not
          know local tipping customs, card-terminal rules, tax law, or a restaurant&apos;s gratuity policy.
          Confirm the physical receipt before collecting or sending money.
        </p>
      </section>
    </div>
  );
}
