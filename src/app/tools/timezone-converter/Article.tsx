export default function TimezoneConverterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Convert a wall time into one real instant</h2>
        <p>
          A local date and time is not complete until it is paired with an IANA time zone such as
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-xs">Asia/Hebron</code>
          or
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-xs">America/New_York</code>.
          This studio resolves that wall time into a UTC instant, then formats the same instant for every selected city.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Plan meetings around local working hours</h2>
        <p>
          Set a meeting duration and a preferred local working-hours window. Each comparison row shows whether the whole
          meeting is inside, partly inside, or outside that window. The planner also ranks nearby half-hour slots so remote
          teams can quickly find a better compromise.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Daylight-saving gaps and repeated times</h2>
        <p>
          When clocks move forward, some local times do not exist. When clocks move backward, one local time can represent
          two different UTC instants. The production checks flag both situations instead of silently publishing an uncertain
          schedule. For ambiguous times, the earlier instant is used and both possibilities remain in the JSON audit.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Batch schedules and production exports</h2>
        <p>
          Paste multiple rows using the format
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1.5 py-0.5 font-mono text-xs">Label | YYYY-MM-DD HH:mm Area/City</code>.
          Invalid rows stay visible for review. Export a comparison CSV, flattened batch CSV, Markdown report, JSON audit,
          UTC-based ICS event, dependency-free JavaScript example, or a ZIP containing the complete planning pack.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Accuracy and privacy</h2>
        <p>
          Calculations run locally through the browser&apos;s current <code className="font-mono text-xs">Intl</code> and IANA
          time-zone data. Governments can change daylight-saving rules, so recheck important future events close to their
          date. Working-hours indicators are planning hints rather than proof that a participant is available.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Plan around people, not UTC offsets</h2>
        <p>
          The expanded scenarios cover remote interviews, MENA–Europe work, Asia and Americas teams, follow-the-sun handoffs, launches, training, board meetings, travel, and daylight-saving reviews. Start from the geography and meeting purpose that resembles your situation, then change participants and working hours.
        </p>
      </section>
    </div>
  );
}
