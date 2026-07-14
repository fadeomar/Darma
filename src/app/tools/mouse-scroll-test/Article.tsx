export default function Article() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          What does the Mouse Scroll Test measure?
        </h3>
        <p className="mt-2">
          The challenge records normalized wheel deltas or touch movement while
          the arena is active. It calculates total traveled distance, average
          pixels per second, event frequency, the strongest rolling half-second
          burst, rhythm smoothness, dominant direction, and the input path used.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Choose a repeatable timer mode
        </h3>
        <p className="mt-2">
          Five seconds is useful for a quick wheel check, ten seconds is the most
          practical comparison, and thirty or sixty seconds emphasize sustained
          movement. Manual mode helps diagnose input behavior, but the result
          depends on when Stop is pressed and is therefore less repeatable.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Per-event evidence and quality checks
        </h3>
        <p className="mt-2">
          New runs preserve each event&apos;s relative timestamp, horizontal and
          vertical movement, and wheel or touch source. The audit flags small
          samples, interrupted pauses, mixed input methods, timer mismatches,
          extreme deltas, frequent reversals, and highly variable rhythm.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Backups and exports
        </h3>
        <p className="mt-2">
          A versioned JSON backup restores the selected timer and up to ten saved
          runs. Markdown summarizes the latest result and audit, CSV provides one
          row per event, and the ZIP production pack combines the backup, report,
          evidence, and handoff notes.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Why pixel scores differ between devices
        </h3>
        <p className="mt-2">
          Wheel notches, browser delta modes, touchpad acceleration, operating-
          system settings, drivers, browser scheduling, and gesture style all
          affect pixel-based scores. Compare runs using the same device, browser,
          timer mode, and input method. This is not a certified hardware,
          accessibility, or medical assessment.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Privacy
        </h3>
        <p className="mt-2">
          Processing stays in the browser. Up to ten attempts are stored in
          localStorage. Nothing is uploaded unless you share a downloaded file
          yourself; those files include relative movement timing, so review them
          before sharing.
        </p>
      </section>
    </div>
  );
}
