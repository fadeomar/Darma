export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          What the reaction test measures
        </h2>
        <p className="mt-3">
          Reaction Time Test records the browser timestamp when the visual
          signal appears and the timestamp of your next valid pointer or
          keyboard input. The difference is shown in milliseconds. Early input
          is counted as a false start and is never accepted as an unusually fast
          result.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Choose rounds and unpredictable signal timing
        </h2>
        <p className="mt-3">
          One round is useful for a quick practice attempt, while five or ten
          rounds provide a more stable same-device comparison. Quick, Standard,
          and Focus delay profiles change the random waiting range. The progress
          rail represents round completion rather than the hidden signal
          countdown, so it cannot be used as a timing cue.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Average, median, spread, and consistency
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Average</strong> summarizes all valid rounds.
          </li>
          <li>
            <strong>Median</strong> is the middle round and is less affected by
            one slow interruption.
          </li>
          <li>
            <strong>Spread</strong> is the difference between the fastest and
            slowest valid rounds.
          </li>
          <li>
            <strong>Consistency</strong> estimates how tightly the round timings
            cluster around the average.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Result-quality checks
        </h2>
        <p className="mt-3">
          The production audit checks whether the run is complete, whether it
          contains enough rounds, whether input methods were mixed, whether
          false starts occurred, and whether any timing is extremely fast or
          unusually slow. These flags do not diagnose ability; they only help
          identify runs that are less suitable for comparison.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Backups and exports
        </h2>
        <p className="mt-3">
          A JSON backup stores the selected settings and up to ten saved runs so
          they can be restored later. The latest run can also be exported as a
          Markdown audit, a per-round CSV file, or a ZIP production pack
          containing the backup, report, round evidence, and handoff notes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Privacy and fair comparisons
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            Timing and history remain in the browser unless you explicitly
            download a file.
          </li>
          <li>
            Compare runs on the same device, display, browser, and input method.
          </li>
          <li>
            Keep the tab focused and avoid heavy background work during a run.
          </li>
          <li>
            Downloaded reports contain round timings, so review them before
            sharing.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-black tracking-[-0.02em] text-[var(--color-text-primary)]">
          Important limitation
        </h2>
        <p className="mt-3">
          Browser reaction scores include monitor refresh, browser scheduling,
          operating-system load, keyboard polling, pointer hardware, and touch
          latency. This tool is for entertainment and consistent same-device
          comparisons. It is not a medical, neurological, accessibility, or
          laboratory assessment.
        </p>
      </section>
    </div>
  );
}
