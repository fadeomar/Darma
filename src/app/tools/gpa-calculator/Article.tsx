export default function GpaCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this calculator do?
        </h2>
        <p>
          Enter each course with its letter grade and credit hours, and the tool shows your grade
          point average on the standard 4.0 scale, along with your total credits and quality
          points. Add or remove rows for as many courses as you need.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How GPA is calculated
        </h2>
        <p>
          Each letter grade maps to grade points (A = 4.0, B = 3.0, and so on). A course&apos;s
          quality points are its grade points multiplied by its credit hours. Your GPA is the sum
          of all quality points divided by the total credit hours — so higher-credit courses weigh
          more heavily on the average.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          The 4.0 grade scale
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>A+ / A = 4.0, A- = 3.7</li>
          <li>B+ = 3.3, B = 3.0, B- = 2.7</li>
          <li>C+ = 2.3, C = 2.0, C- = 1.7</li>
          <li>D+ = 1.3, D = 1.0, D- = 0.7, F = 0.0</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Tips for accurate results
        </h2>
        <p>
          Use the same credit-hour value your school assigns to each course, and leave out
          pass/fail courses that do not carry grade points. Schools vary slightly in how they
          weight plus and minus grades, so treat this as a close estimate rather than an official
          transcript figure. Everything is computed locally in your browser.
        </p>
      </section>
    </div>
  );
}
