const sectionTitle =
  "mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]";
const body =
  "space-y-4 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] sm:text-base";

export default function JsonFormatterArticle() {
  return (
    <article className={`${body} max-w-none`}>
      <section>
        <h2 className={sectionTitle}>What the production studio adds</h2>
        <p>
          Formatting makes JSON easier to read, while minifying removes
          unnecessary whitespace. The production studio adds a separate review
          layer: four summary cards, payload metrics, precision checks, risky-key
          detection, practical presets, reusable formatter profiles, and
          developer exports.
        </p>
        <p>
          The Ready, Review, or Blocked state describes technical preparation
          for the current payload. It does not prove that the data satisfies an
          API contract or business rule.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Valid JSON is not the same as valid data</h2>
        <p>
          Standard JSON can contain an object, array, string, number, boolean,
          or null at the root. A payload can therefore parse successfully while
          still missing required fields, using the wrong value types, or
          violating an enum, date format, or application constraint.
        </p>
        <p>
          Use the formatter to check syntax and inspect structure. Use JSON
          Schema, application validation, contract tests, or API tests for
          domain-specific correctness.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Large integer precision in JavaScript</h2>
        <p>
          JavaScript numbers use IEEE-754 double precision. Integer literals
          outside the safe range from <code>-(2^53 - 1)</code> to
          <code>2^53 - 1</code> can be rounded when passed through
          <code>JSON.parse</code>. This commonly affects database IDs, payment
          references, timestamps from other systems, and account identifiers.
        </p>
        <p>
          The studio scans the original source before formatting. When it finds
          an unsafe integer, format, minify, repair, module export, and ZIP export
          are paused to prevent a silent digit change. Quote exact identifiers as
          strings before continuing.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Repair is conservative, not magical</h2>
        <p>
          Fix JSON can remove JavaScript-style comments, convert simple
          single-quoted strings, quote uncomplicated property names, remove
          trailing commas, and replace unsupported values such as NaN or
          undefined with null. Every repair is reported.
        </p>
        <p>
          Automatic repair can change meaning. Review the generated result
          before replacing the source, especially when unsupported values were
          converted to null or when the input uses complex JavaScript syntax
          rather than loose JSON.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Risky keys and sensitive payloads</h2>
        <p>
          Keys such as <code>__proto__</code>, <code>prototype</code>, and
          <code>constructor</code> are valid JSON, but they require care when a
          payload is recursively merged into application objects. The studio
          flags their paths so downstream code can use safe parsing and merge
          practices.
        </p>
        <p>
          Secret-like key names such as password, token, apiKey, and
          authorization trigger a privacy warning. Detection is based on key
          names only and does not transmit values. Be mindful of clipboard
          history, browser extensions, downloaded files, shared folders, and
          optional local history.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Profiles and production exports</h2>
        <p>
          A Darma formatter profile stores indentation, key sorting, and the
          preferred inspector view. It deliberately excludes the JSON payload
          and local history, so it can be shared as a formatting convention.
          Uploading a profile applies those settings without replacing the
          current input.
        </p>
        <p>
          The Markdown audit and CSV contain settings and metrics without JSON
          values. JavaScript, TypeScript, formatted JSON, minified JSON, and the
          production ZIP intentionally contain the current payload. Inspect
          those files before sharing them.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Payload size and inspector performance</h2>
        <p>
          Local file import is limited to 5 MB to keep the interactive editor,
          tree, table, and repeated formatting responsive. Payloads above 1 MB
          receive a warning because performance depends on nesting, node count,
          browser memory, and device speed.
        </p>
        <p>
          For larger files, prefer a streaming parser, command-line tool, or
          application-specific data pipeline. Text and stats views are generally
          safer than expanding a very large tree.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Frequently asked questions</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Does sorting keys change the data?
            </h3>
            <p className="mt-1">
              It preserves parsed values but changes the textual property order.
              That is useful for stable reviews and diffs, but it can create a
              large file diff even when values are unchanged.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Does a valid result guarantee schema compliance?
            </h3>
            <p className="mt-1">
              No. Syntax validation only confirms that a JSON parser accepts the
              text. Required fields, types, ranges, and business rules need a
              schema or application validator.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Does the profile include my payload?
            </h3>
            <p className="mt-1">
              No. The profile contains formatter settings only. The ZIP and
              developer modules do include the payload by design.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Why is an integer blocking export?
            </h3>
            <p className="mt-1">
              Its exact value is outside JavaScript&apos;s safe integer range. Put
              the identifier in quotes so formatting cannot round its digits.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
