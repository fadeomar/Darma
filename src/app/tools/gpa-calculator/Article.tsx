export default function GpaCalculatorArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What this GPA studio calculates</h2>
        <p>
          Add semester courses with letter grades and credit hours to calculate a credit-weighted
          term GPA. You can also enter your current cumulative GPA and completed credits to project
          the new cumulative result, then set a target GPA to see the semester average required to
          reach it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How semester and cumulative GPA work</h2>
        <p>
          Each included course contributes grade points multiplied by credit hours. The semester GPA
          is total semester quality points divided by semester credits. A projected cumulative GPA
          combines the quality points represented by your existing record with the quality points
          from the entered semester. That is why a long academic history changes more slowly than a
          first-year record.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Target GPA planning</h2>
        <p>
          The target planner solves for the semester GPA needed across the entered credit load. A
          required result above 4.00 means the target cannot be reached in one term under this scale;
          it may still be reachable over additional semesters. The what-if table compares several
          semester averages so you can see how each would affect the projected cumulative GPA.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Common 4.0 scale used</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>A+ / A = 4.0 and A- = 3.7</li>
          <li>B+ = 3.3, B = 3.0, and B- = 2.7</li>
          <li>C+ = 2.3, C = 2.0, and C- = 1.7</li>
          <li>D+ = 1.3, D = 1.0, D- = 0.7, and F = 0.0</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Important institutional differences</h2>
        <p>
          Schools may handle repeated courses, transfer credits, pass/fail classes, withdrawals,
          rounding, A+ grades, and major GPA differently. Mark non-GPA courses as skipped, and use
          this result as a planning estimate rather than an official transcript calculation. All
          inputs and exports are produced locally in your browser.
        </p>
      </section>
    </div>
  );
}
