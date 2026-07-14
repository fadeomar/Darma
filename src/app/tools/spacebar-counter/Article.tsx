export default function Article() {
  return (
    <div className="space-y-6 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          What does the Spacebar Counter measure?
        </h3>
        <p className="mt-2">
          The challenge records individual spacebar keydown events during a
          timed or manual sprint. New runs preserve a relative timestamp and
          input source for every counted press, allowing the result to show PPS,
          burst speed, press gaps, rhythm consistency, and evidence quality.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Why are held-key repeats ignored?
        </h3>
        <p className="mt-2">
          Browsers often emit repeated keydown events when a key is held. Those
          events do not represent separate physical taps, so the tool excludes
          them from the score and reports how many were ignored. Use separate
          presses for a fair keyboard comparison.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Result quality checks
        </h3>
        <p className="mt-2">
          The production audit reviews sample size, timer completion, unusually
          short gaps, long interruptions, mixed input methods, consistency, and
          hold-repeat activity. A warning does not automatically invalidate a
          run; it explains why two scores may not be directly comparable.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Backups and exports
        </h3>
        <p className="mt-2">
          A versioned JSON backup restores the selected mode and up to ten local
          attempts. The Markdown report summarizes the latest run and its audit,
          while CSV provides one row per counted press. The ZIP pack combines
          those files for a portable local handoff.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Privacy and limitations
        </h3>
        <p className="mt-2">
          All timing and history processing remains in the browser unless you
          explicitly download a file. Keyboard firmware, switch behavior,
          browser scheduling, operating-system settings, posture, and touch
          fallback can affect results. Treat PPS as an entertainment and
          same-device comparison metric, not a certified hardware,
          accessibility, or medical assessment.
        </p>
      </section>
    </div>
  );
}
