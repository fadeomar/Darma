export default function BmiCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is BMI?
        </h2>
        <p>
          Body Mass Index (BMI) is a quick screening number that relates your weight to your height.
          It is widely used to put weight into one of four broad bands, and to estimate a healthy
          weight range for a given height.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How it is calculated
        </h2>
        <p>
          In metric units, BMI is your weight in kilograms divided by the square of your height in
          metres. In imperial units, it is 703 × weight in pounds ÷ the square of your height in
          inches. Both formulas give the same number for the same person.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          The categories
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
          Important limitations
        </h2>
        <p>
          BMI does not measure body fat directly and does not account for muscle mass, bone density,
          age, sex, or where fat is stored. Very muscular people can have a high BMI while being
          healthy. Treat it as a general guide and talk to a healthcare professional for advice.
          Everything here is calculated locally in your browser.
        </p>
      </section>
    </div>
  );
}
