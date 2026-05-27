export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is a text cleaner?
        </h2>
        <p>
          A text cleaner is a tool that normalises, repairs, and reformats raw
          text without requiring you to write code or open a spreadsheet. Whether
          you are pasting content from a PDF, a Word document, a CMS export, or a
          web scrape, the result usually contains hidden problems: double spaces,
          mixed line endings, inconsistent capitalisation, duplicate lines, or
          encoding artefacts. A text cleaner lets you fix all of those in
          seconds.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Common text problems this tool solves
        </h2>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Extra whitespace
            </strong>{" "}
            — multiple consecutive spaces left by copy-pasting from PDFs or
            formatted documents collapse to a single space per line.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Inconsistent capitalisation
            </strong>{" "}
            — apply UPPERCASE, lowercase, Title Case, Sentence case, or
            developer-friendly formats like camelCase and snake_case with one
            click.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Mixed line endings
            </strong>{" "}
            — Windows (CRLF), Unix (LF), and old Mac (CR) endings coexist in
            text pasted from different sources. Normalize to LF for consistent
            processing.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Duplicate lines
            </strong>{" "}
            — deduplicate a list of emails, domain names, keywords, or CSV rows
            without writing a script.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Blank line clutter
            </strong>{" "}
            — remove all empty lines, or collapse runs of three or more blank
            lines down to a single separator.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
              Unsorted lists
            </strong>{" "}
            — sort lines A to Z or Z to A for quick alphabetical ordering of any
            line-separated list.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How case conversion works
        </h2>
        <p>
          The case converter supports ten formats covering everyday writing and
          developer naming conventions:
        </p>
        <dl className="mt-3 space-y-3">
          {[
            ["UPPERCASE / lowercase", "Simple full-caps or all-lowercase conversion, letter by letter."],
            ["Title Case", "Capitalises the first letter of every word, useful for headings and article titles."],
            ["Sentence case", "Capitalises only the first letter of each sentence while lowercasing the rest — ideal for correcting auto-caps."],
            ["iNVERSE", "Flips every letter: uppercase becomes lowercase and vice versa. A classic novelty that is also handy for quickly testing case-sensitive systems."],
            ["camelCase", "Joins words without separators, lowercasing the first word and capitalising each subsequent one. The standard for JavaScript variables and JSON keys."],
            ["PascalCase", "Like camelCase but the very first letter is also capitalised. Used for class names, React components, and TypeScript types."],
            ["snake_case", "Joins words with underscores, all lowercase. Common in Python, SQL column names, and many file naming conventions."],
            ["kebab-case", "Joins words with hyphens, all lowercase. The standard for CSS class names, URL slugs, and HTML attributes."],
          ].map(([name, desc]) => (
            <div key={name as string}>
              <dt className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{name}</dt>
              <dd className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-tertiary)]">{desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Chaining transforms
        </h2>
        <p>
          Every transform you apply acts on the current output. If you click{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Remove extra spaces
          </strong>{" "}
          and then{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Sentence case
          </strong>
          , the second transform operates on the already-cleaned text — not the
          original. This chainable model lets you build a multi-step cleaning
          pipeline without writing any code.
        </p>
        <p className="mt-3">
          To restart with the original text, click{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Reset output
          </strong>
          . To pipe the cleaned result back into the input field for further
          editing, click{" "}
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Use as input
          </strong>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy and security
        </h2>
        <p>
          Every transform runs entirely in your browser using JavaScript. Your
          text is never sent to a server, never stored in a database, and never
          logged. You can use this tool safely with confidential content —
          internal documents, customer data, or draft copy — without any
          privacy risk.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {[
            [
              "Does this work with non-English text?",
              "Yes. Case conversion uses JavaScript's built-in Unicode handling, so accented Latin characters (é, ñ, ü) and many other scripts work correctly. The camelCase / PascalCase / snake_case / kebab-case converters also preserve Arabic characters (Unicode range U+0600–U+06FF) as single word units rather than splitting them.",
            ],
            [
              "Will sorting handle numbers correctly?",
              "The sort uses a locale-aware comparison (localeCompare with sensitivity: 'base') which sorts alphabetically, not numerically. Lines starting with '10' will appear before '2' in A→Z order. For numeric sorting, preprocess your list to zero-pad numbers.",
            ],
            [
              "What counts as a 'word' in the stats bar?",
              "Words are counted by splitting on whitespace (spaces, tabs, newlines) and filtering out empty tokens. This matches the most common definition used by word processors.",
            ],
            [
              "Can I clean a very long document?",
              "Yes. All processing is synchronous JavaScript in your browser, so performance depends on your device. Documents up to several hundred thousand characters typically process in under a millisecond. Very large pastes (multi-megabyte) may take longer.",
            ],
            [
              "Is there a keyboard shortcut to copy the output?",
              "Not currently, but you can click the Copy button and the keyboard shortcut Ctrl+A, Ctrl+C in the output textarea works as expected.",
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
