export default function PomodoroTimerArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this timer do?
        </h2>
        <p>
          It is a focus timer built around the Pomodoro Technique: work in a 25-minute focus block,
          take a 5-minute break, and after four focus blocks take a longer 15-minute break. You can
          also set any custom length for a plain countdown.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          The Pomodoro Technique
        </h2>
        <p>
          The method breaks work into short, focused intervals separated by deliberate rest. Each
          focus block is a single &ldquo;pomodoro.&rdquo; Working in fixed blocks makes it easier to
          start, reduces distractions, and builds in regular breaks so you can keep going for longer.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Tips for using it
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Pick one task for each focus block and ignore everything else.</li>
          <li>Stand up and rest your eyes during breaks.</li>
          <li>Keep this tab open — the countdown shows in the tab title.</li>
          <li>Use a custom length for short tasks or longer deep-work sessions.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Good to know
        </h2>
        <p>
          The timer runs entirely in your browser and plays a short sound when a block ends. Because
          it relies on this tab staying open, it works best when you keep Darma visible while you
          work. Nothing is uploaded or tracked.
        </p>
      </section>
    </div>
  );
}
