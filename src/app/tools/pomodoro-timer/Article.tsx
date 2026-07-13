export default function PomodoroTimerArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Plan focus cycles, not just countdowns</h2>
        <p>
          Pomodoro Focus Studio combines a drift-resistant browser timer with a task, a daily session
          target, configurable focus and break lengths, and a local session log. Use a practical
          preset or build a cycle that fits study, coding, writing, design, or administrative work.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Why the timer uses an absolute deadline</h2>
        <p>
          Browsers may slow normal intervals when a tab is hidden or a device enters a power-saving
          state. Instead of assuming every interval fires exactly one second later, this timer stores
          an absolute end time and recalculates the remaining seconds from the current clock. That
          approach corrects ordinary interval drift when the tab becomes active again.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Build a sustainable cycle</h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Use 25/5 for general focus, or a longer preset when interruption costs are high.</li>
          <li>Name one clear task before starting so the session log remains useful.</li>
          <li>Keep short breaks restorative: stand, move, hydrate, or rest your eyes.</li>
          <li>Use auto-start selectively; continuous cycles are convenient but easier to ignore.</li>
          <li>Set a realistic daily target rather than treating every available hour as focus time.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Sound, notifications, and browser limits</h2>
        <p>
          Completion sounds use the Web Audio API, while desktop notifications require explicit
          browser permission. Operating systems and browsers can still suppress alerts under focus,
          battery-saving, or background-tab policies. Keep the tab title visible when a completion
          alert is important.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Privacy and exports</h2>
        <p>
          Tasks, settings, and up to 200 session entries are stored in local browser storage. Nothing
          is uploaded. You can export a readable Markdown summary, JSON audit, CSV session history,
          a drift-resistant JavaScript starter, or a ZIP pack for documentation and analysis.
        </p>
      </section>
    </div>
  );
}
