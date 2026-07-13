const sectionTitle = "mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]";

export default function DateDifferenceArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className={sectionTitle}>Calendar difference versus elapsed duration</h2>
        <p>
          Calendar mode explains a range in whole years, months, and remaining days. That is useful
          for ages, notice periods, anniversaries, and project plans because month lengths are
          respected. Date &amp; time mode instead converts both wall-clock inputs to UTC and measures
          the absolute elapsed duration in days, hours, minutes, and seconds.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Inclusive and exclusive date counting</h2>
        <p>
          An elapsed date difference normally excludes the ending boundary: July 1 to July 2 is one
          elapsed day. Inclusive counting includes both calendar dates, so the same range contains
          two dates. The studio shows both totals and lets you decide which rule should be used for
          workday planning.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Business-day calculation</h2>
        <p>
          Choose a Saturday–Sunday, Friday–Saturday, or Sunday-only weekend pattern, then add custom
          holidays as YYYY-MM-DD values. Weekend dates are excluded first; a holiday that already
          falls on a weekend is not deducted twice. Invalid and duplicate holiday entries remain
          visible in the production checks instead of being silently ignored.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Fixed UTC offsets and daylight saving</h2>
        <p>
          Date &amp; time mode accepts a fixed UTC offset for each boundary. This is useful for
          cross-zone meeting calculations and server timestamps when the applicable offset is known.
          Fixed offsets do not automatically infer daylight-saving changes from named regions such
          as Europe/London or America/New_York, so confirm the offset for historical or future dates.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Production-ready exports</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Markdown report</strong> for project notes, tickets, and handoffs.</li>
          <li><strong>JSON audit</strong> with inputs, totals, milestones, workdays, and checks.</li>
          <li><strong>Milestones CSV</strong> for spreadsheets and lightweight schedules.</li>
          <li><strong>JavaScript helper</strong> for date-only and fixed-offset calculations.</li>
          <li><strong>ZIP pack</strong> containing all outputs in one local download.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>Privacy</h2>
        <p>
          All calculations, holiday parsing, report generation, and ZIP creation run locally in your
          browser. The dates you enter are not uploaded to Darma or another service.
        </p>
      </section>
    </div>
  );
}
