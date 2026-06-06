export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is JSON?
        </h2>
        <p>
          JSON (JavaScript Object Notation) is a lightweight, text-based data
          interchange format. It is language-independent but uses conventions
          familiar from C-family languages, making it easy to read and write for
          humans and trivial to parse and generate for machines. Today it is the
          dominant format for web APIs, configuration files, database exports,
          and inter-service communication.
        </p>
        <p className="mt-3">
          A valid JSON value is one of: an object (key-value pairs wrapped in
          curly braces), an array (ordered list wrapped in square brackets), a
          string (double-quoted), a number, a boolean (
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            true
          </code>{" "}
          or{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            false
          </code>
          ), or{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            null
          </code>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Format vs Minify vs Validate — what is the difference?
        </h2>
        <dl className="space-y-4">
          <div>
            <dt className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Format (Prettify)
            </dt>
            <dd className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Takes compact or messy JSON and rewrites it with consistent
              indentation and line breaks. The result is easy to read in an
              editor, review in a pull request, or paste into documentation.
              The data is not changed — only the whitespace.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Minify
            </dt>
            <dd className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Strips all unnecessary whitespace and produces a single-line
              version. Useful for embedding JSON inside code strings, reducing
              payload size in HTTP requests, or fitting data into systems that
              do not expect line breaks. Again, only whitespace is removed —
              the data is identical.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Validate
            </dt>
            <dd className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">
              Checks whether the input is syntactically valid JSON according to
              the ECMA-404 / RFC 8259 specification. If it is valid, you see a
              green confirmation. If not, you see the parser error and — where
              possible — the line and column where the problem was found.
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common JSON syntax errors and how to fix them
        </h2>
        <div className="space-y-4">
          {[
            {
              problem: "Trailing comma",
              example: '{ "name": "Alex", }',
              fix: 'JSON does not allow a comma after the last element. Remove the trailing comma: { "name": "Alex" }',
            },
            {
              problem: "Single quotes instead of double quotes",
              example: "{ 'name': 'Alex' }",
              fix: "JSON requires double quotes for both keys and string values. Replace all single quotes with double quotes.",
            },
            {
              problem: "Unquoted property name",
              example: '{ name: "Alex" }',
              fix: 'Every key in a JSON object must be a double-quoted string: { "name": "Alex" }',
            },
            {
              problem: "Comments in JSON",
              example: '{ "name": "Alex" // admin }',
              fix: "JSON does not support comments. Remove the comment entirely, or move the note outside the JSON payload.",
            },
            {
              problem: "Unmatched or missing bracket / brace",
              example: '{ "items": [1, 2, 3 }',
              fix: "Every opening bracket [ or brace { must have a matching closing bracket ] or brace }. Count your nesting levels carefully.",
            },
            {
              problem: "Undefined or NaN as a value",
              example: '{ "score": NaN }',
              fix: "JSON only supports numbers, strings, booleans, null, objects, and arrays. Replace NaN or Infinity with null or a valid number.",
            },
          ].map(({ problem, example, fix }) => (
            <div key={problem} className="rounded-xl border border-black/8 bg-[var(--color-surface-subtle)] p-4 dark:border-white/10 dark:bg-[var(--color-code-surface)]/40">
              <p className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{problem}</p>
              <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--color-danger-bg)] px-3 py-2 font-mono text-xs text-[var(--color-danger-text)]">
                {example}
              </pre>
              <p className="mt-2 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">{fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How indentation is chosen
        </h2>
        <p>
          The formatter supports three indent styles. Two spaces is the most
          common choice in JavaScript and TypeScript codebases. Four spaces is
          common in Python, Java, and many style guides. Tabs are preferred in
          some codebases for accessibility reasons (screen readers and editors
          can render tab width independently). Choose the style that matches
          your project or the system you are pasting into.
        </p>
      </section>



      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          New workspace views
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            [
              "Text view",
              "Use this for the formatted or minified JSON output. It includes code-style highlighting, line numbers, folding, and safe copy/download controls.",
            ],
            [
              "Tree view",
              "Use this when a response has deeply nested objects or arrays. You can collapse sections and inspect the shape without scrolling through raw text.",
            ],
            [
              "Table view",
              "Use this when the root value is an array of objects, such as product lists, API rows, logs, or exported records.",
            ],
            [
              "Stats view",
              "Use this to understand payload depth, key counts, root type, object/array counts, and minified size reduction.",
            ],
          ].map(([title, body]) => (
            <div key={title as string} className="rounded-xl border border-black/8 bg-[var(--color-surface-subtle)] p-4 dark:border-white/10 dark:bg-[var(--color-code-surface)]/40">
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{title}</h3>
              <p className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>


      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy and security
        </h2>
        <p>
          All JSON processing happens entirely in your browser using the native{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            JSON.parse
          </code>{" "}
          and{" "}
          <code className="rounded bg-[var(--color-surface-subtle)] px-1 font-mono text-xs dark:bg-[var(--color-code-surface)]">
            JSON.stringify
          </code>{" "}
          APIs that ship in every modern JavaScript engine. Your data is never
          sent to a server or logged. Optional history is stored only in your
          current browser if you explicitly enable it. This makes the tool
          safe for use with internal API payloads, customer data, credentials,
          or any content you would not want to pass through a third-party
          service.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {[
            [
              "Can I format very large JSON files?",
              "Yes. All processing is synchronous JavaScript. Files up to a few megabytes typically format in well under a second. Very large payloads (10 MB+) may take a moment depending on your device, but there is no hard limit imposed by the tool.",
            ],
            [
              "Does formatting change my data in any way?",
              "No. Format and Minify only alter whitespace. The parse-then-stringify round-trip preserves all values exactly, including numbers, booleans, null, nested objects, and arrays. The only exception is that key order within objects may be normalised to the order the JavaScript engine encountered them — which for most cases is the original order.",
            ],
            [
              "Why does the error say 'at position X' instead of a line number?",
              "The native V8 JavaScript engine (used in Chrome, Node.js, and Edge) reports errors by character offset. This tool converts that offset into a line and column number automatically, so you should always see a human-readable location. Firefox reports line and column directly.",
            ],
            [
              "What is the difference between JSON and JSON5 or JSONC?",
              "Standard JSON (RFC 8259) does not allow comments, trailing commas, or single-quoted strings. JSON5 and JSONC (JSON with Comments) are supersets that add these features. This tool validates standard JSON, but the Fix JSON action can safely remove common JSON5/JSONC-style additions such as comments and trailing commas before producing standard JSON output.",
            ],
            [
              "Can I use this for JSON inside environment variables or dotenv files?",
              "Yes. A common pattern is to store a JSON object as a string inside an environment variable. You can paste the value here to validate and format it, then minify it for pasting back into the variable value.",
            ],
            [
              "Does the tool support JSON arrays at the root level?",
              "Yes. A root-level JSON array — for example a list of objects — is fully valid JSON and is handled correctly by Format, Minify, Validate, Tree, Table, and Stats views.",
            ],
          ].map(([q, a]) => (
            <div key={q as string}>
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{q}</h3>
              <p className="mt-1 text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
