const sectionTitle =
  "mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]";
const body =
  "space-y-4 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)] sm:text-base";

export default function TextCleanerArticle() {
  return (
    <article className={`${body} max-w-none`}>
      <section>
        <h2 className={sectionTitle}>What the production studio adds</h2>
        <p>
          Text cleanup is rarely just one replacement. Copied PDFs can contain
          broken line endings, repeated lines, excess spaces, inconsistent
          punctuation, and script-specific characters. The studio lets you
          arrange transformations into an explicit workflow, run them in order,
          compare the result with the source, and save the workflow separately
          from the text.
        </p>
        <p>
          Four summary cards surface the current step count, output size,
          changed-line estimate, and readiness state. Production checks flag
          empty workflows, stale output, very large input, contradictory case or
          sort actions, extraction placed too early, redundant blank-line
          operations, and settings that can create unexpectedly large output.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Why workflow order matters</h2>
        <p>
          Each step receives the output of the previous step. Removing empty
          lines before collapsing blank lines makes the collapse step redundant.
          Applying uppercase and then lowercase means only the final lowercase
          step determines the result. Extracting emails before another case
          conversion can also alter the extracted addresses.
        </p>
        <p>
          Use the earlier and later controls beside each selected action to make
          the order deliberate. A practical general cleanup usually normalizes
          line endings and spacing first, removes duplicates next, then sorts or
          formats. Extraction normally belongs at the end unless you
          intentionally want to transform the extracted values.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Arabic cleanup</h2>
        <p>
          Arabic text copied from PDFs can contain tashkeel, tatweel, alef
          variants, alif maqsura, and irregular spacing around Arabic
          punctuation. The Arabic actions let you apply each rule independently.
          The copied Arabic PDF action combines the common cleanup sequence into
          one step, so adding all of its component actions again is usually
          unnecessary.
        </p>
        <p>
          Normalization changes characters intentionally. Review names,
          quotations, religious text, linguistic examples, and any material
          where diacritics or original orthography carry meaning before
          replacing the source.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Understanding the comparison metrics</h2>
        <p>
          Character, word, and line deltas are signed: a negative number means
          content was removed, while a positive number means formatting added
          content. Changed lines are estimated by comparing line frequencies
          between input and output. This is useful for a quick review, but it is
          not a full semantic diff and does not prove that the meaning stayed
          unchanged.
        </p>
        <p>
          Destructive actions such as extraction, duplicate removal, and
          empty-line removal can be correct while still discarding source
          content. Keep the original document until the cleaned result has been
          reviewed.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Workflow files and production exports</h2>
        <p>
          Workflow JSON stores only action IDs plus prefix and suffix settings.
          It intentionally excludes pasted input and generated output, making it
          suitable for sharing a repeatable cleanup recipe. Imported files are
          validated, unknown actions are ignored, duplicates are removed, and
          oversized files are rejected.
        </p>
        <p>
          The Markdown report and CSV contain workflow information and metrics
          without embedding the source text. The JavaScript runner is a
          standalone CommonJS file that applies the selected workflow in another
          Node.js process. The production ZIP is different: it intentionally
          includes the cleaned text alongside the workflow, report, metrics, and
          JavaScript runner.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Privacy and sensitive text</h2>
        <p>
          Transformations run locally in the browser and do not require an
          upload. However, privacy still depends on the device, browser
          extensions, clipboard history, downloaded files, shared folders, and
          backups. The studio detects email and phone-like values only to remind
          you that exported files may contain personal data; it does not send
          those values anywhere.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Frequently asked questions</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Does workflow JSON include my text?
            </h3>
            <p className="mt-1">
              No. It contains the ordered action IDs and formatting settings
              only. The production ZIP includes cleaned output because that
              export is explicitly designed as a deliverable pack.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Why is my output marked stale?
            </h3>
            <p className="mt-1">
              The input changed after the last run. Run the workflow again so
              the displayed result and production pack correspond to the current
              source text.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Can I run one action without changing my saved workflow?
            </h3>
            <p className="mt-1">
              Yes. The Run button on an action creates output with that single
              action. The selected workflow remains available for later editing
              and export.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              Does a Ready status guarantee correct meaning?
            </h3>
            <p className="mt-1">
              No. Ready means the workflow is structurally usable and the output
              matches the current input run. Human review is still required
              whenever content is removed, extracted, sorted, normalized, or
              converted to a different case.
            </p>
          </div>
        </div>
      </section>
      <section>
        <h2 className={sectionTitle}>Start from the text source or the output you need</h2>
        <p>
          The preset library now covers copied PDFs, captions, developer lists,
          Arabic normalization, recipient extraction, phone and hashtag lists,
          CSV-style columns, keyword cleanup, comma-list conversion, bullets,
          numbered lists, slug seeds, and constant names. A preset is only a
          starting workflow: inspect the selected actions and remove any step
          that changes meaning you need to preserve.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Extraction presets intentionally discard surrounding text</h2>
        <p>
          Link, email, phone, hashtag, mention, and number extraction produce a
          focused list rather than a cleaned version of the original prose. Use
          them when the list itself is the deliverable. For editing paragraphs or
          documents, prefer cleanup and normalization actions that preserve the
          original sentence content.
        </p>
      </section>
    </article>
  );
}
