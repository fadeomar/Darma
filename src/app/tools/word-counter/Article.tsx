export default function WordCounterArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What does this word counter measure?
        </h2>
        <p>
          As you type or paste text, this tool updates a live set of counts: words,
          characters with and without spaces, sentences, paragraphs, and lines. It also
          estimates reading and speaking time, lists your most frequent words, and shows
          how your text fits common length limits.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How are words and sentences counted?
        </h2>
        <p>
          Words are sequences of letters or digits, including contractions like
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">it&apos;s</code>
          and hyphenated terms like
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">well-known</code>.
          Sentences are split on
          <code className="mx-1 rounded bg-[var(--color-surface-subtle)] px-1 py-0.5 font-mono text-xs dark:bg-[var(--color-code-surface)]">. ! ?</code>
          and the Arabic question mark, and paragraphs are separated by blank lines. Latin
          and Arabic text are both supported.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Who is it for?
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>Students checking an essay or assignment against a word limit.</li>
          <li>Writers and content creators shaping posts, captions, and titles.</li>
          <li>SEO work that needs titles near 60 characters and meta descriptions near 160.</li>
          <li>Anyone trimming a message to fit a platform&apos;s character limit.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          How is reading time estimated?
        </h2>
        <p>
          Reading time assumes about 200 words per minute and speaking time about 130 words
          per minute, which are common averages for adults. They are estimates to help you
          plan, not exact measurements.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Privacy
        </h2>
        <p>
          Everything is calculated locally in your browser. Your text is never uploaded to a
          Darma server, so you can safely paste drafts, notes, and private content.
        </p>
      </section>
    </div>
  );
}
