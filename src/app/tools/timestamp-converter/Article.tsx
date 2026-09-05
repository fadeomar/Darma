export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Unix timestamps represent instants</h2>
        <p>
          A Unix timestamp measures time from the Unix epoch, January 1, 1970 at
          00:00:00 UTC. The number itself is not tied to a time zone. UTC,
          Hebron, London, New York, or Tokyo are display views of the same
          instant.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Seconds, milliseconds, microseconds, and nanoseconds</h2>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border-subtle)]">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-[var(--color-surface-subtle)] text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
              <tr><th className="px-4 py-3">Unit</th><th className="px-4 py-3">Typical current length</th><th className="px-4 py-3">Common source</th></tr>
            </thead>
            <tbody>
              {[
                ["Seconds", "10 digits", "Unix APIs and databases"],
                ["Milliseconds", "13 digits", "JavaScript Date.now()"],
                ["Microseconds", "16 digits", "Logs and analytics systems"],
                ["Nanoseconds", "19 digits", "Tracing and high-resolution telemetry"],
              ].map(([unit, length, source]) => (
                <tr key={unit} className="border-t border-[var(--color-border-subtle)]">
                  <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">{unit}</td>
                  <td className="px-4 py-3 font-mono text-xs">{length}</td>
                  <td className="px-4 py-3">{source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Why auto-detection needs review</h2>
        <p>
          Digit length is a useful signal, but not an absolute rule. An 11- or
          12-digit number can be interpreted as a far-future seconds timestamp
          or an older millisecond timestamp. The studio scores every supported
          interpretation using digit length and a plausible calendar range, then
          keeps the alternatives visible instead of hiding the assumption.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">ISO input versus browser-local input</h2>
        <p>
          ISO values ending in <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs">Z</code> or
          containing an explicit offset such as <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs">+03:00</code> identify one exact instant.
          A browser-local date has no offset, so its meaning depends on the
          device time zone and daylight-saving rules.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Microsecond and nanosecond precision</h2>
        <p>
          JavaScript <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs">Date</code> stores time in whole milliseconds. The converter can safely read large
          microsecond and nanosecond strings without requiring BigInt, but the
          visual date output necessarily truncates digits below one millisecond.
          Keep the original raw value when exact telemetry precision matters.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Batch conversion format</h2>
        <p>Enter one timestamp per line. A row can contain only a value or an explicit unit alias:</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[var(--color-code-surface)] p-4 font-mono text-xs text-[var(--color-code-text)]">{`1700000000 seconds
1700000000000 ms
1700000000123456 us
1700000000123456789 ns`}</pre>
        <p className="mt-3">
          Invalid rows remain in the table and CSV with an error message, so a
          production review does not silently discard data.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Common production checks</h2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Confirm the source unit instead of trusting digit length alone.</li>
          <li>Review dates far beyond the expected business range.</li>
          <li>Preserve raw sub-millisecond values when exact ordering matters.</li>
          <li>Use ISO values with offsets when sharing an instant across systems.</li>
          <li>Process very large datasets in streamed or server-side batches.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">Use realistic timestamp sources</h2>
        <p>
          Presets now represent API fields, JavaScript events, database microseconds, tracing nanoseconds, webhooks with offsets, release dates, incident logs, historical values, the 2038 boundary, and mixed validation batches. Use them to recognize timestamp length and precision patterns before processing production data.
        </p>
      </section>
    </div>
  );
}
