export default function ReadabilityArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">What does this readability checker do?</h2><p>It estimates how easy English prose is to read using Flesch Reading Ease, Flesch-Kincaid Grade Level, and the Gunning Fog Index. Supporting sentence, word, and syllable statistics show what drives each score.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">How the scores work</h2><p>Reading Ease runs from 0 to 100, where a higher number generally means easier prose. Grade Level estimates a US school grade, while Gunning Fog estimates the years of education a reader may need. These formulas reward shorter sentences and familiar, lower-syllable words.</p></section>
      <section><h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Common uses</h2><ul className="list-inside list-disc space-y-2"><li>Review an essay or assignment draft.</li><li>Simplify an article for a broad audience.</li><li>Check help text, documentation, or learning materials.</li><li>Compare revisions without uploading private writing.</li></ul></section>
    </div>
  );
}
