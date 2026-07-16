export default function RegexTesterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>Test JavaScript regular expressions visually</h2>
      <p>
        This workbench uses the browser&apos;s native JavaScript <code>RegExp</code> engine. Enter a pattern, toggle flags, and inspect the exact ranges, line and column positions, captures, named groups, and replacement output that the target runtime will produce.
      </p>

      <h2>A production-oriented workflow</h2>
      <ol>
        <li>Start with a preset that resembles your extraction, validation, cleanup, or transformation task.</li>
        <li>Add representative positive, negative, empty, malformed, and boundary samples.</li>
        <li>Inspect highlighted ranges and capture values instead of checking only the total match count.</li>
        <li>Review syntax, replacement references, compatibility notes, privacy warnings, and the execution guard.</li>
        <li>Export the JavaScript or TypeScript module and add automated worst-case tests in the target application.</li>
      </ol>

      <h2>Portable projects and production packs</h2>
      <p>
        Project JSON stores the pattern, flags, replacement, and test sample so the exact workbench can be reopened later. The production ZIP adds JavaScript and TypeScript modules, a Markdown audit, per-match CSV evidence, the sample input, and the current replacement output.
      </p>
      <p>
        Project and report exports include the sample text. Replace credentials, access tokens, customer data, and other sensitive values with synthetic examples before sharing a file.
      </p>

      <h2>Flags change runtime behavior</h2>
      <p>
        The <code>g</code> flag finds every match; without it, JavaScript stops after the first match and performs only the first replacement. Use <code>i</code> for case-insensitive matching, <code>m</code> for line-based anchors, <code>s</code> when a dot must cross line breaks, and <code>u</code> for Unicode-aware behavior. Sticky <code>y</code> matching begins at the current index and is mainly useful in parsers.
      </p>

      <h2>Capture and replacement syntax</h2>
      <p>
        Parentheses create numbered captures such as <code>$1</code>. Named groups such as <code>(?&lt;year&gt;\d&#123;4&#125;)</code> can be reused as <code>$&lt;year&gt;</code>. The token <code>$&amp;</code> inserts the full match. The audit warns when a replacement references a group that the current pattern does not define.
      </p>

      <h2>Performance and ReDoS guardrails</h2>
      <p>
        Nested quantifiers and ambiguous repeated alternatives can cause catastrophic backtracking. The browser preview blocks patterns that trigger multiple risk heuristics and pauses medium-risk patterns on samples longer than 128 characters. This prevents the workbench from deliberately running some dangerous cases on the main browser thread.
      </p>
      <p>
        These checks are conservative heuristics, not a mathematical proof of safety. Production code still needs strict input limits, realistic worst-case tests, and—when hostile input is possible—an execution strategy that can be timed out or isolated.
      </p>

      <h2>Privacy</h2>
      <p>
        Patterns, samples, matches, replacements, imports, and ZIP generation are processed locally in the browser. No input is uploaded and the tool requires no server route.
      </p>
    </article>
  );
}
