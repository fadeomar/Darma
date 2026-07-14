export default function Article() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          What does the Click Speed Test measure?
        </h3>
        <p className="mt-2">
          The challenge records primary mouse, touch, or pen presses inside the
          target while a sprint is active. It calculates total clicks, clicks
          per second, the strongest rolling one-second burst, average and
          fastest click gaps, rhythm consistency, and the input path used.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Choose a repeatable timer mode
        </h3>
        <p className="mt-2">
          Five seconds is useful for a quick warm-up, ten seconds is the most
          practical comparison, and thirty or sixty seconds emphasize endurance.
          Manual mode is useful for input testing, but its result depends on
          when you press Stop and is therefore less repeatable.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Per-click evidence and quality checks
        </h3>
        <p className="mt-2">
          New runs preserve each click&apos;s relative timestamp and pointer
          source. The production audit uses that evidence to flag very small
          samples, interrupted pauses, mixed input methods, inconsistent rhythm,
          timing mismatches, and gaps below eight milliseconds that should be
          treated as an event diagnostic rather than a human-speed claim.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Backups and exports
        </h3>
        <p className="mt-2">
          A versioned JSON backup restores the selected timer and up to ten
          saved runs. Markdown summarizes the latest result and audit, CSV
          provides one row per click, and the ZIP production pack combines the
          backup, report, evidence, and handoff notes.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Why CPS differs between devices
        </h3>
        <p className="mt-2">
          Mouse debounce, touch sampling, browser scheduling, operating-system
          settings, display refresh, grip, and fatigue can all affect the
          result. Compare runs using the same device, browser, mode, and input
          method. This is an entertainment and browser-input tool, not a
          certified hardware, accessibility, or medical assessment.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Privacy
        </h3>
        <p className="mt-2">
          Processing stays in the browser. Up to ten attempts are stored in
          localStorage. Nothing is uploaded unless you choose to share a file
          that you downloaded yourself; those files can reveal your clicking
          rhythm, so review them before sharing.
        </p>
      </section>
    </div>
  );
}
