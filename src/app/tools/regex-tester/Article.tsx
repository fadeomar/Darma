export default function RegexTesterArticle() {
  return (
    <article className="prose prose-slate max-w-none dark:prose-invert">
      <h2>What regex testers are for</h2>
      <p>
        A regular expression tester helps you design patterns before putting them into application code, validation rules, data cleanup scripts, test fixtures, or one-off text transformations. Live matches make it easier to see exactly which parts of the text are selected.
      </p>

      <h2>JavaScript regex flags</h2>
      <p>
        JavaScript regular expressions support flags such as <code>g</code> for global matching, <code>i</code> for case-insensitive matching, <code>m</code> for multiline anchors, <code>s</code> for dot-all matching, <code>u</code> for Unicode-aware behavior, <code>y</code> for sticky matching, and <code>d</code> for match indices in browsers that support it.
      </p>

      <h2>Capture groups and named groups</h2>
      <p>
        Parentheses create capture groups that can be inspected in the match list and reused in replacements. Named groups such as <code>(?&lt;year&gt;\d&#123;4&#125;)</code> make complex patterns easier to read and can be referenced with replacement syntax like <code>$&lt;year&gt;</code>.
      </p>

      <h2>Replacement syntax</h2>
      <p>
        JavaScript replacements can use <code>$&amp;</code> for the full match, <code>$1</code>, <code>$2</code>, and higher numbers for capture groups, and <code>$&lt;name&gt;</code> for named captures. This is useful for rewriting dates, masking IDs, or extracting structured text.
      </p>

      <h2>Privacy</h2>
      <p>
        Regex testing is processed locally in your browser. The pattern, sample text, matches, and replacement output are not uploaded to a server, and this tool does not add a server route.
      </p>
    </article>
  );
}
