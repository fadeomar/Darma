export default function WordCounterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">More than a basic word count</h2>
        <p>
          Word Counter Studio measures words, characters, sentences, paragraphs, lines, reading time, speaking time, and estimated page length. It also reviews sentence and paragraph length, surfaces repeated keywords and phrases, and compares the draft with a selected writing target.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Writing goals and production checks</h2>
        <p>
          Choose a practical target such as a 500-word assignment, SEO title, meta description, short social post, blog article, or five-minute speech. The progress indicator explains whether the draft is below, within, or above the selected range. Production checks then flag unusually long sentences, dense paragraphs, repeated phrases, all-caps text, and possible keyword stuffing.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How words and sentences are detected</h2>
        <p>
          Words are detected using Unicode-aware letter and number matching, so Latin, Arabic, and many other writing systems work without converting the text. Contractions and hyphenated terms remain single words. Sentence detection handles common punctuation, decimal numbers, and frequent abbreviations more carefully than a simple split on every period.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Keyword density is a review signal</h2>
        <p>
          Density is the number of appearances divided by the total document word count. A high value does not automatically mean the writing is poor, especially for short technical text or product names. Use the keyword and repeated-phrase panels to find patterns, then judge whether each repetition is necessary and natural.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Reading and speaking time</h2>
        <p>
          The default estimates use 200 words per minute for reading and 130 words per minute for speaking. Both rates are editable because delivery speed depends on the audience, language, complexity, pauses, and presentation style. Treat the result as a planning estimate rather than an exact duration.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Start from the piece you are actually writing</h2>
        <p>
          Each sample is paired with a matching target, so loading one sets both the text and
          the goal it should be measured against. The library covers student essays and
          research abstracts, cover letters and job-search writing, SEO titles and meta
          descriptions, social and thread posts, LinkedIn updates, product listings, press
          releases, README introductions, meeting summaries, long-form guide openings, and
          five- and ten-minute speech scripts.
        </p>
        <p>
          Two samples exist to test the counter rather than to be imitated: a deliberately
          keyword-heavy draft that triggers density warnings, and a punctuation stress test
          full of hyphenated words, ellipses, abbreviations, and grouped numerals that naive
          word counting handles badly. An Arabic sample covers non-Latin script and
          right-to-left punctuation.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Exporting the audit</h2>
        <p>
          Copy or download a Markdown summary, JSON audit, keyword-density CSV, sentence-review CSV, or a ZIP pack containing the source text and all reports. These exports are useful for editorial handoff, assignment evidence, SEO review, or comparing revisions over time.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Privacy</h2>
        <p>
          All counting and analysis run locally in your browser. Drafts, essays, scripts, and private notes are not uploaded to a Darma server.
        </p>
      </section>
    </div>
  );
}
