export default function BmiCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is BMI?
        </h2>
        <p>
          Body Mass Index (BMI) is a quick screening number that compares weight with height. It is
          useful for a fast adult weight-status snapshot, but it does not directly measure body fat,
          muscle mass, bone density, or health risk.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How to use this upgraded tool
        </h2>
        <p>
          Enter weight and height, then add optional waist and target weight values. The dashboard
          shows your BMI score, adult category, healthy weight range, distance from that range,
          waist-to-height ratio, and projected BMI at your target weight. You can also save results
          locally to compare changes over time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          The adult BMI categories
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Below 18.5 — underweight</li>
          <li>18.5 to 24.9 — normal weight</li>
          <li>25 to 29.9 — overweight</li>
          <li>30 and above — obese</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why waist-to-height ratio helps
        </h2>
        <p>
          Waist-to-height ratio adds context because BMI does not show where weight is carried. A
          common practical guide is to keep waist measurement below half of height, but this is still
          a screening signal rather than a diagnosis.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Important limitations and privacy
        </h2>
        <p>
          Adult BMI categories may not apply to children, teens, pregnancy, athletes, older adults,
          or people with medical conditions that affect weight or height. Treat the result as a
          general guide and speak with a healthcare professional for personal advice. Calculations,
          saved history, and CSV export all happen locally in your browser.
        </p>
      </section>
    </div>
  );
}
