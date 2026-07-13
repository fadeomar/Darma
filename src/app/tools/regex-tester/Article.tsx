export default function RegexTesterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Test JavaScript regular expressions visually</h2>
      <p>
        This regex workbench uses the browser&apos;s native JavaScript <code>RegExp</code> engine. Enter a pattern, toggle flags, and inspect the exact text ranges, line and column positions, capture groups, named groups, and replacement output before moving the expression into an application.
      </p>

      <h2>A practical workflow</h2>
      <ol>
        <li>Start with a preset that resembles your extraction, validation, cleanup, or transformation task.</li>
        <li>Replace the sample with representative input, including empty values and malformed edge cases.</li>
        <li>Inspect highlighted ranges and capture groups rather than checking only the total match count.</li>
        <li>Review the production checks, then copy the JavaScript or TypeScript snippet and add automated tests in your project.</li>
      </ol>

      <h2>Flags change real runtime behavior</h2>
      <p>
        The <code>g</code> flag finds every match; without it, JavaScript stops after the first match and performs only the first replacement. Use <code>i</code> for case-insensitive matching, <code>m</code> for line-based anchors, <code>s</code> when a dot must cross line breaks, and <code>u</code> for Unicode-aware behavior. Sticky <code>y</code> matching begins at the current index and is useful mainly in parsers.
      </p>

      <h2>Capture and replacement syntax</h2>
      <p>
        Parentheses create numbered captures such as <code>$1</code>. Named groups such as <code>(?&lt;year&gt;\d&#123;4&#125;)</code> can be reused as <code>$&lt;year&gt;</code>. The token <code>$&amp;</code> inserts the full match. The inspector warns when a replacement references a group that the current pattern does not define.
      </p>

      <h2>Performance and ReDoS checks</h2>
      <p>
        Nested quantifiers and ambiguous repeated alternatives can cause catastrophic backtracking on hostile or unusually long input. The built-in checks flag common warning signs and pause risky previews when the sample is long. These checks are conservative heuristics, not a mathematical safety proof; production patterns still need realistic worst-case tests and input limits.
      </p>

      <h2>Privacy</h2>
      <p>
        Patterns, test text, matches, and exports are processed locally in the browser. No input is uploaded, and the tool does not require a server route.
      </p>
    </article>
  );
}
