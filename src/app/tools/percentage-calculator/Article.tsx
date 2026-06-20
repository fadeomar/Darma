export default function PercentageCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What can this calculator do?
        </h2>
        <p>
          It answers the four everyday percentage questions: what a percentage of a number is, what
          percentage one number is of another, the percentage change between two numbers, and the
          result of increasing or decreasing a value by a percentage. Pick a mode and fill in the
          two values.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          The formulas
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Percent of:</strong> value × percent ÷ 100.</li>
          <li><strong>X is what percent of Y:</strong> X ÷ Y × 100.</li>
          <li><strong>Percent change:</strong> (new − old) ÷ old × 100.</li>
          <li><strong>Apply a change:</strong> value × (1 + percent ÷ 100).</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Work out a discount or a sales-tax amount.</li>
          <li>Calculate a tip or a grade as a percentage.</li>
          <li>See how much a price or a metric changed over time.</li>
          <li>Add or remove a percentage from a budget figure.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Good to know
        </h2>
        <p>
          Percentage change is always measured against the starting (old) value, so it cannot be
          computed when the starting value is zero. All calculations run locally in your browser, so
          your numbers are never uploaded.
        </p>
      </section>
    </div>
  );
}
