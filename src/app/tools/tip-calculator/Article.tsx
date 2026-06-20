export default function TipCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this calculator do?
        </h2>
        <p>
          Enter the bill, pick a tip percentage, and set how many people are sharing. The tool shows
          the tip amount, the grand total, and exactly what each person owes — with an option to
          round each share up for easy cash payment.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How the split is calculated
        </h2>
        <p>
          The tip is worked out on the original bill (bill × tip ÷ 100) and added to the total. That
          total is then divided by the number of people. Rounding up takes each share to the next
          whole currency unit, so the group may collect a little more than the exact total — useful
          when paying with cash.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Split a restaurant bill evenly with friends.</li>
          <li>Work out a fair tip at 15%, 18%, or 20%.</li>
          <li>Figure out each person&apos;s share for a group order.</li>
          <li>Round shares up so the cash adds up cleanly.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Good to know
        </h2>
        <p>
          This calculator splits the bill evenly across everyone. Currency is shown as plain numbers
          with two decimals, so it works with any currency. Everything is computed locally in your
          browser — nothing is uploaded.
        </p>
      </section>
    </div>
  );
}
