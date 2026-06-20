export default function DateDifferenceArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this calculator do?
        </h2>
        <p>
          Pick a start date and an end date, and the tool shows the gap between them as a
          calendar breakdown (years, months, and days) plus totals in days, weeks, and
          months. Set the end date to today to calculate an age or how long ago something
          happened.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How is the breakdown calculated?
        </h2>
        <p>
          The years and months are counted as whole calendar units, then the remaining
          days are measured from that point to the end date. Months differ in length, so
          the calculator clamps to the end of a month where needed. For example, from
          January 31 to March 1 is reported as 1 month and 1 day, not a negative number of
          days.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common uses
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Work out an exact age in years, months, and days.</li>
          <li>Count down to (or up from) a deadline, event, or anniversary.</li>
          <li>Measure a project duration or notice period in weeks and days.</li>
          <li>Check how many days are left until a due date.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          A note on time zones
        </h2>
        <p>
          Calculations use the calendar date only and ignore the time of day and time
          zones, which keeps results stable and predictable. Everything is computed
          locally in your browser, so your dates are never uploaded to a server.
        </p>
      </section>
    </div>
  );
}
