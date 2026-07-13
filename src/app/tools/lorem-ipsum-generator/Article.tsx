export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Placeholder content should test the layout</h2>
        <p>
          Good placeholder copy is not only random Latin. It should reproduce the
          shape of the final interface: short labels for compact controls, longer
          paragraphs for editorial layouts, and structured blocks for cards,
          testimonials, pricing tiers, product descriptions, and onboarding steps.
        </p>
        <p className="mt-3">
          This studio generates both plain text and semantic HTML locally in the
          browser. The responsive preview helps you catch wrapping, spacing, and
          content-density problems before real copy is available.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Use seeds for repeatable design reviews</h2>
        <p>
          Random content is useful during exploration, but it becomes difficult to
          compare screenshots when every refresh changes the copy. A named seed
          produces the same content again, so design revisions can be reviewed
          against a stable baseline.
        </p>
        <p className="mt-3">
          Change the seed when you intentionally want another variation. Keep it
          unchanged when testing typography, responsive breakpoints, visual
          regression snapshots, or component states.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Choose the right generation mode</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["Words", "Useful for labels, chips, tag clouds, and narrow text containers."],
            ["Sentences", "Useful for summaries, card descriptions, alerts, and empty states."],
            ["Paragraphs", "Useful for articles, documentation, CMS previews, and reading layouts."],
            ["Structured", "Useful for complete UI blocks such as heroes, FAQs, products, and pricing tiers."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-4">
              <h3 className="font-bold text-[var(--color-text-primary)]">{title}</h3>
              <p className="mt-1 text-xs leading-6">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Production checklist</h2>
        <p>
          Placeholder content must be removed before publishing. Replace fake
          links, prices, claims, names, and calls to action. Test the final interface
          with real content lengths, translated copy, empty values, unusually long
          words, and user-generated text before release.
        </p>
        <p className="mt-3">
          The exported report identifies repeated blocks, oversized payloads,
          placeholder links, and settings that do not affect the selected mode.
          It is a handoff aid, not a substitute for content review.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">Export formats</h2>
        <p>
          Plain text works well for design tools and CMS fields. The standalone
          HTML file provides a responsive browser preview. The React starter renders
          the generated copy safely without <code>dangerouslySetInnerHTML</code>.
          The JSON report and CSV block list are useful for QA, automation, and
          design-system documentation.
        </p>
      </section>
    </div>
  );
}
