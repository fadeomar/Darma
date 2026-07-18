export default function BmiCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What this screening studio calculates
        </h2>
        <p>
          Body Mass Index compares weight with height using the formula weight
          in kilograms divided by height in metres squared. The studio also
          calculates a height-based adult weight range, an optional
          waist-to-height ratio, and a mathematical BMI preview for an optional
          target weight. All calculations run locally in the browser.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Adult BMI bands
        </h2>
        <p>
          The adult screening bands used here are below 18.5, 18.5 to 24.9, 25.0
          to 29.9, and 30.0 or above. These are population screening categories
          rather than diagnoses. The tool keeps the internal category key stable
          for saved files while presenting the 18.5–24.9 band as “Healthy
          weight.”
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why applicability checks matter
        </h2>
        <p>
          Adult BMI bands should not be applied as though they were universal.
          Children and teens need age-specific growth assessment, pregnancy
          changes how weight should be interpreted, and high muscle mass can
          raise BMI without measuring body fat directly. Phase 30 therefore
          audits applicability separately from the numerical result and never
          labels a BMI category itself as a software error.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Waist-to-height context
        </h2>
        <p>
          Waist-to-height ratio divides waist circumference by height using the
          same units. A common public-health guide is to keep waist below half
          of height. It can add context alongside BMI, but it remains a
          screening measure and should not be used to diagnose a condition.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Import, exports, and privacy
        </h2>
        <p>
          A Darma JSON project restores measurements and context. The Markdown,
          CSV, JSON, print, and ZIP exports can contain personal health-related
          measurements, so store and share them carefully. Browser history is
          local to the current device and can be cleared at any time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Reference guidance
        </h2>
        <p>
          The implementation was checked against official adult BMI guidance
          from the CDC and WHO, and waist-to-height guidance from the NHS. See
          the exported methodology file for a compact record of the formulas and
          source organizations.
        </p>
        <ul className="mt-3 list-inside list-disc space-y-2">
          <li>
            <a
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html"
              target="_blank"
              rel="noreferrer"
            >
              CDC adult BMI categories
            </a>
          </li>
          <li>
            <a
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight"
              target="_blank"
              rel="noreferrer"
            >
              WHO overweight and obesity definitions
            </a>
          </li>
          <li>
            <a
              className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline"
              href="https://www.nhs.uk/health-assessment-tools/calculate-your-waist-to-height-ratio"
              target="_blank"
              rel="noreferrer"
            >
              NHS waist-to-height ratio guidance
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
