export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-slate-700 dark:text-slate-300">
      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          What is a Unix timestamp?
        </h2>
        <p>
          A Unix timestamp is a number that represents a single instant in time
          as an offset from the Unix epoch: January 1, 1970 at 00:00:00 UTC.
          It is commonly used in APIs, logs, databases, analytics pipelines, and
          debugging tools because it is compact and easy for computers to sort.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Seconds vs milliseconds
        </h2>
        <p>
          Unix timestamps are commonly represented in seconds. JavaScript{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            Date
          </code>{" "}
          values internally use milliseconds since the Unix epoch, and{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            Date.getTime()
          </code>{" "}
          returns milliseconds. That is why the same instant can appear as a
          10-digit seconds value or a 13-digit milliseconds value.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Timestamp to date examples
        </h2>
        <div className="space-y-3">
          {[
            ["0", "1970-01-01T00:00:00.000Z"],
            ["1700000000", "2023-11-14T22:13:20.000Z"],
            ["1700000000000", "2023-11-14T22:13:20.000Z"],
            ["-1", "1969-12-31T23:59:59.000Z"],
          ].map(([timestamp, iso]) => (
            <div
              key={timestamp}
              className="rounded-xl border border-black/10 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900/40"
            >
              <p className="text-xs text-slate-500">Timestamp</p>
              <p className="font-mono text-xs text-slate-800 dark:text-slate-200">
                {timestamp}
              </p>
              <p className="mt-2 text-xs text-slate-500">UTC ISO output</p>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                {iso}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Date to timestamp examples
        </h2>
        <p>
          A browser local date/time input is interpreted using your current
          browser timezone. An ISO value such as{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs dark:bg-slate-800">
            2030-01-01T00:00:00.000Z
          </code>{" "}
          includes the UTC timezone marker, so it describes the same instant for
          everyone.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          UTC vs local time
        </h2>
        <p>
          A timestamp is not timezone-specific. It represents an instant. The
          timezone only affects how that instant is displayed. UTC output is
          useful for logs, APIs, and shared debugging. Browser local output is
          useful when you need to compare an event with the time shown on your
          own device.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Common developer use cases
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>Debugging API payloads and database records</li>
          <li>Checking log events across local time and UTC</li>
          <li>Converting JavaScript millisecond values from browser code</li>
          <li>Creating test data for scheduled jobs and expiry times</li>
          <li>Comparing timestamps from analytics, queues, and webhooks</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">
          Privacy note
        </h2>
        <p>
          All timestamp and date conversion runs entirely in your browser using
          built-in JavaScript date APIs. Your timestamps and dates are never
          uploaded, stored, or sent to a server.
        </p>
      </section>
    </div>
  );
}
