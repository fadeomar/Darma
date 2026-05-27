export default function Article() {
  return (
    <div className="space-y-8 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          What is Lorem Ipsum?
        </h2>
        <p>
          Lorem Ipsum is placeholder text that has been used in typesetting and
          publishing since the 1500s. The standard passage beginning with{" "}
          <em>Lorem ipsum dolor sit amet</em> is derived from a work by Cicero
          written in 45 BC — specifically a scrambled version of{" "}
          <em>de Finibus Bonorum et Malorum</em>, Book I and II.
        </p>
        <p className="mt-3">
          It became the industry standard dummy text because its distribution of
          letters approximates that of actual Latin text, making it less
          distracting than repeated phrases like "Content here, content here"
          when reviewing a layout.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Why designers use placeholder text
        </h2>
        <p>
          When reviewing a design, the goal is to evaluate layout, spacing,
          typography, visual hierarchy, and information architecture — not to
          read copy. Placeholder text keeps the focus on structure by providing
          realistic visual weight without meaningful content that could distract
          or anchor unfinished decisions.
        </p>
        <p className="mt-3">
          It also prevents stakeholders from making copy edits during a design
          review, which keeps the conversation focused on the right things at the
          right stage of the process.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Classic lorem ipsum vs. readable placeholder
        </h2>
        <p>
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Classic lorem ipsum
          </strong>{" "}
          is best when the audience understands it as a convention. It's
          universally recognized in design and development contexts, and its
          unfamiliarity keeps focus on the layout rather than the words.
        </p>
        <p className="mt-3">
          <strong className="text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
            Readable placeholder text
          </strong>{" "}
          is better when sharing designs with non-design stakeholders —
          executives, clients, or users in usability tests — who may not
          recognize latin filler text and may read it as a mistake. It also
          helps teams who need to evaluate the design's readability and line
          breaks under realistic conditions.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Using placeholder text in wireframes and mockups
        </h2>
        <p>
          In wireframes, placeholder text usually appears in its simplest form —
          short labels like "Title" or lines to indicate text blocks. In
          higher-fidelity mockups, realistic placeholder content is more valuable
          because it better simulates the final experience, reveals layout issues
          that only appear with real-length text, and helps the team evaluate
          typographic hierarchy.
        </p>
        <p className="mt-3">
          For CMS previews and component library documentation, structured
          placeholder blocks are ideal — pre-formed hero sections, feature cards,
          testimonials, and product descriptions fill the layout exactly as real
          content would, without requiring actual copy to be written first.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">
          Frequently asked questions
        </h2>
        <div className="space-y-5">
          {[
            {
              q: "Can I use the generated text in client projects?",
              a: "Yes. All generated content is free to use in any project — personal, client, or commercial. It's placeholder text and carries no restrictions.",
            },
            {
              q: "How do I generate HTML-wrapped output?",
              a: "Switch the output format to HTML in the controls panel. The generator will wrap paragraphs in <p> tags, headings in <h2> tags, and structured blocks in appropriate semantic HTML.",
            },
            {
              q: "What's the difference between Paragraphs and Structured mode?",
              a: "Paragraphs mode generates free-form text blocks — the number and length are controlled by your settings. Structured mode generates complete, purpose-built content blocks like hero sections, testimonials, or pricing tables, shaped like real UI copy.",
            },
            {
              q: "Why does the text change every time I click Regenerate?",
              a: "Each generation shuffles and recombines the content pool to produce a unique variation. This ensures your mockup content doesn't look identical across different components or pages.",
            },
            {
              q: "Can I download the output?",
              a: "Yes. Use the Download button below the output area to save your generated content as a .txt or .html file, depending on the format you have selected.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 className="font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]">{q}</h3>
              <p className="mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
