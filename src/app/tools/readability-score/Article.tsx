export default function ReadabilityArticle() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What this readability studio measures</h2>
        <p>
          The tool estimates how difficult English prose may be for a reader. It combines Flesch Reading Ease with four grade-level formulas, then shows the sentence length and complex-word patterns that drive those results. The consensus grade is an average for comparison, not a promise that every reader at that grade will understand the text.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Why several formulas are shown</h2>
        <p>
          Flesch-Kincaid and Gunning Fog rely heavily on sentence length and syllables. SMOG focuses on words with three or more syllables, while Coleman-Liau uses letters and sentence frequency. Their results rarely match exactly, so the metric spread helps you see whether one formula is reacting more strongly than the others.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">A practical editing workflow</h2>
        <ol className="list-inside list-decimal space-y-2">
          <li>Choose the closest audience target before comparing the scores.</li>
          <li>Review very long sentences first and give each sentence one main action or idea.</li>
          <li>Check repeated complex words, but keep specialist terms when they protect accuracy.</li>
          <li>Review possible passive constructions manually because the detection is heuristic.</li>
          <li>Recalculate after meaningful edits and compare drafts of similar length.</li>
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How much text should you analyze?</h2>
        <p>
          A short sentence can still produce an estimate, but scores become more stable with roughly 100 words and at least five sentences. Compare complete sections rather than isolated headings, navigation labels, poetry, source code, or lists of unrelated phrases.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Important limitations</h2>
        <p>
          Readability formulas do not verify facts, tone, accessibility, cultural clarity, or whether a technical term is necessary. Syllable counts and passive-voice flags are browser-based heuristics. Use the report to locate review candidates, then make the final decision with the intended audience and subject matter in mind.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Private local processing</h2>
        <p>
          Text analysis, file import, and report generation run in your browser. Nothing is uploaded by this tool, and the audit pack is created only when you choose an export action.
        </p>
      </section>
    </div>
  );
}
