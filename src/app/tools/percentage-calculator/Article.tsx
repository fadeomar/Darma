export default function PercentageCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">A percentage calculator for more than one formula</h2>
        <p>
          Percentage questions look similar but often use different reference values. This studio
          separates percentage amount, part-to-whole ratio, percentage change, reverse change,
          percentage difference, discounts, markup, and gross margin so the denominator stays clear.
          Each mode shows the substituted formula, derived metrics, and a short production review.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">The eight supported workflows</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Percent of a number:</strong> base × percent ÷ 100.</li>
          <li><strong>Part as a percent of whole:</strong> part ÷ whole × 100.</li>
          <li><strong>Percentage change:</strong> (new − start) ÷ start × 100.</li>
          <li><strong>Apply a change:</strong> value × (1 + signed percent ÷ 100).</li>
          <li><strong>Reverse a change:</strong> final ÷ (1 + signed percent ÷ 100).</li>
          <li><strong>Percentage difference:</strong> absolute gap divided by average magnitude.</li>
          <li><strong>Discount:</strong> original price minus its percentage savings.</li>
          <li><strong>Markup and margin:</strong> profit divided by cost and selling price respectively.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Percentage change versus percentage difference</h2>
        <p>
          Percentage change is directional and requires a starting value. Percentage difference is
          symmetric and is useful when two measurements are peers rather than an old and new value.
          Swapping the two inputs changes the sign of percentage change, but it does not change
          percentage difference.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Markup is not gross margin</h2>
        <p>
          Markup divides profit by cost, while gross margin divides profit by selling price. A product
          that costs 45 and sells for 72 has 60% markup but 37.5% gross margin. The business mode shows
          both figures together to reduce a common pricing mistake.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What the production checks review</h2>
        <p>
          The calculator identifies undefined denominators, discounts above 100%, changes below −100%,
          near-zero reverse multipliers, values outside JavaScript&apos;s safe integer range, negative
          profit, and unusually large scale differences. These checks do not replace domain-specific
          financial, medical, statistical, or contractual review.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Rounding and privacy</h2>
        <p>
          Calculations use full browser number precision internally and round only for display. Choose
          the visible decimal precision that matches your task, and keep the unrounded JSON result when
          downstream software needs it. Inputs, reports, and ZIP exports are generated locally in your
          browser and are not uploaded.
        </p>
      </section>
    </div>
  );
}
